# Shared helpers for the Blender 5.2 asset script (text_mesh.py).
# Import from a script run with:  blender -b --factory-startup --python-exit-code 1 -P script.py -- ...
import argparse
import json
import os
import struct
import sys
import time
import zlib

import bpy


def script_args(description, add_arguments):
    """argparse over the arguments after Blender's '--' separator."""
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog=os.path.basename(sys.argv[0]) if sys.argv else "script", description=description)
    add_arguments(p)
    return p.parse_args(argv)


def reset_scene():
    """Empty file (no default cube/camera/light). Equivalent of File > New > General minus objects."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    strip_render_metadata(bpy.context.scene)
    return bpy.context.scene


def strip_render_metadata(scene):
    """By default Blender writes Date/RenderTime/Camera/... into PNG tEXt chunks and EXR headers, so identical pixels
    still produce different file bytes on every run. Turn every use_stamp_* flag off for reproducible outputs."""
    r = scene.render
    for p in r.bl_rna.properties:
        if p.identifier.startswith("use_stamp") and p.type == "BOOLEAN":
            setattr(r, p.identifier, False)


class Timer:
    def __init__(self):
        self.t0 = time.perf_counter()
        self.marks = {}
        self._last = self.t0

    def mark(self, name):
        now = time.perf_counter()
        self.marks[name] = round(now - self._last, 3)
        self._last = now
        print(f"[time] {name}: {self.marks[name]:.3f}s", flush=True)
        return self.marks[name]

    def total(self):
        return round(time.perf_counter() - self.t0, 3)


def principled(name, base_color, metallic=0.0, roughness=0.5, coat=0.0, coat_roughness=0.03,
               specular_ior_level=None, emission=None, emission_strength=0.0, double_sided=False):
    """glTF-friendly material: a single Principled BSDF wired to the output.
    Blender 5.x: new materials already contain Principled BSDF + Material Output;
    Material.use_nodes is deprecated (removal planned for 6.0), so we never touch it.
    glTF doubleSided = not use_backface_culling, and Blender's default is culling OFF, so every material would
    export doubleSided:true. Closed solids don't need it: cull back faces unless double_sided=True."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_backface_culling = not double_sided
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if coat:
        bsdf.inputs["Coat Weight"].default_value = coat          # -> KHR_materials_clearcoat
        bsdf.inputs["Coat Roughness"].default_value = coat_roughness
    if specular_ior_level is not None:
        bsdf.inputs["Specular IOR Level"].default_value = specular_ior_level  # -> KHR_materials_specular
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    # viewport colour too (Workbench / solid view), harmless for export
    m.diffuse_color = (*base_color, 1.0)
    m.metallic = metallic
    m.roughness = roughness
    return m


def triangle_count(mesh):
    mesh.calc_loop_triangles()
    return len(mesh.loop_triangles)


def write_png_gray8(path, width, height, rows_bytes):
    """Minimal deterministic 8-bit grayscale PNG writer (no colour management involved).
    rows_bytes: bytes of length width*height, row 0 = top of image."""
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type None
        raw += rows_bytes[y * width:(y + 1) * width]

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def gltf_export(filepath, compression="none", selected_only=True, extra=None):
    """Blender 5.2 glTF exporter (io_scene_gltf2 v5.2.40) with parameter names verified in 5.2.
    compression: 'none' | 'draco' | 'meshopt' (EXT_meshopt_compression) | 'meshopt_khr' (KHR_meshopt_compression)."""
    kw = dict(
        filepath=filepath,
        export_format="GLB",
        use_selection=selected_only,
        export_apply=True,               # apply modifiers
        export_yup=True,                 # Blender Z-up -> glTF Y-up: (x, y, z)_bl -> (x, z, -y)_gltf
        export_normals=True,
        export_texcoords=True,
        export_tangents=False,
        export_materials="EXPORT",
        export_vertex_color="NONE",      # 4.2+ replacement for export_colors; we use _CELL/UV instead
        export_attributes=True,          # custom attributes whose name starts with '_' -> '_NAME' accessor
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_extras=False,
        export_draco_mesh_compression_enable=False,
        export_meshopt_compression_enable=False,
    )
    if compression == "draco":
        kw.update(export_draco_mesh_compression_enable=True,
                  export_draco_mesh_compression_level=6,
                  export_draco_position_quantization=14,
                  export_draco_normal_quantization=10,
                  export_draco_texcoord_quantization=12,
                  export_draco_generic_quantization=12)
    elif compression == "meshopt":
        kw.update(export_meshopt_compression_enable=True, export_meshopt_extension="EXT_meshopt_compression")
    elif compression == "meshopt_khr":
        kw.update(export_meshopt_compression_enable=True, export_meshopt_extension="KHR_meshopt_compression")
    if extra:
        kw.update(extra)
    t0 = time.perf_counter()
    res = bpy.ops.export_scene.gltf(**kw)
    dt = time.perf_counter() - t0
    size = os.path.getsize(filepath) if os.path.exists(filepath) else -1
    print(f"[gltf] {compression:12s} {res} {size:>10d} B  {dt:.2f}s  {filepath}", flush=True)
    return {"file": os.path.basename(filepath), "compression": compression, "bytes": size,
            "seconds": round(dt, 3), "result": sorted(res)}


def glb_json(path):
    """Read the JSON chunk of a GLB (for verifying extensions/attributes without external tools)."""
    with open(path, "rb") as f:
        data = f.read()
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    assert magic == b"glTF", magic
    clen, ctype = struct.unpack_from("<I4s", data, 12)
    assert ctype == b"JSON"
    return json.loads(data[20:20 + clen].decode("utf-8"))


def summarize_glb(path):
    j = glb_json(path)
    prims = []
    for m in j.get("meshes", []):
        for p in m["primitives"]:
            prims.append({"mesh": m.get("name"), "attributes": sorted(p["attributes"].keys()),
                          "material": j["materials"][p["material"]]["name"] if "material" in p else None,
                          "extensions": sorted(p.get("extensions", {}).keys())})
    return {"extensionsUsed": j.get("extensionsUsed", []), "extensionsRequired": j.get("extensionsRequired", []),
            "primitives": prims}


def write_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)
    print("[json] wrote", path)
