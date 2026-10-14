"""3D extruded name -> cleaned mesh -> GLB (+Draco/+meshopt) and an exact top-down footprint mask for the
web wave simulation (PEC obstacle), with world<->pixel metadata.

Run (Blender 5.2, background):
  blender -b --factory-startup --python-exit-code 1 -P text_mesh.py -- \
      --font fonts/archivoblack_ArchivoBlack-Regular.ttf --text "GALABA VAMSI" --out out/text --name name

Outputs in --out:
  <name>.glb, <name>.draco.glb, <name>.meshopt.glb   letters, centred on the origin, base on the y=0 plane (glTF)
  <name>_mask.png        8-bit grayscale footprint (255 = inside the metal), supersampled coverage
  <name>_mask.json       exact world<->pixel mapping in Blender and glTF/three.js coordinates
  <name>_mask_check.png  (with --verify) Blender orthographic Workbench render of the same footprint
  <name>_stats.json      triangle counts, timings, file sizes
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

import common


def add_args(p):
    p.add_argument("--font", required=True)
    p.add_argument("--text", default="GALABA VAMSI")
    p.add_argument("--out", default="out/text")
    p.add_argument("--name", default="name")
    p.add_argument("--size", type=float, default=1.0, help="font size (Blender units = metres)")
    p.add_argument("--extrude", type=float, default=0.06, help="half-depth of the extrusion")
    p.add_argument("--bevel", type=float, default=0.012, help="bevel depth (adds to outline and depth)")
    p.add_argument("--bevel-res", type=int, default=3)
    p.add_argument("--offset", type=float, default=None,
                   help="outline offset; default = -bevel so the bevelled silhouette matches the glyph outline")
    p.add_argument("--res-u", type=int, default=8, help="curve tessellation per bezier segment")
    p.add_argument("--spacing", type=float, default=1.0, help="character spacing factor")
    p.add_argument("--merge", type=float, default=1e-5, help="merge-by-distance threshold")
    p.add_argument("--dissolve-deg", type=float, default=1.0, help="limited-dissolve angle")
    p.add_argument("--smooth-deg", type=float, default=30.0, help="smooth-by-angle threshold")
    p.add_argument("--px-per-unit", type=float, default=512.0, help="mask resolution (pixels per metre)")
    p.add_argument("--pad", type=float, default=0.0625, help="mask margin around the footprint (metres)")
    p.add_argument("--ss", type=int, default=4, help="supersampling per axis for mask coverage")
    p.add_argument("--verify", action="store_true", help="also render the footprint with Blender (ortho Workbench) and compare")
    p.add_argument("--no-compress", action="store_true")


def build_text(a):
    font = bpy.data.fonts.load(os.path.abspath(a.font), check_existing=True)
    cu = bpy.data.curves.new("NameText", type="FONT")
    cu.body = a.text
    cu.font = font
    cu.size = a.size
    cu.space_character = a.spacing
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.extrude = a.extrude
    cu.bevel_mode = "ROUND"
    cu.bevel_depth = a.bevel
    cu.bevel_resolution = a.bevel_res
    cu.offset = -a.bevel if a.offset is None else a.offset   # ROUND bevel grows the outline by bevel_depth
    cu.resolution_u = a.res_u
    ob = bpy.data.objects.new("NameText", cu)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def to_clean_mesh(text_ob, a, stats):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(text_ob.evaluated_get(dg))   # curve/text -> mesh (no bpy.ops needed)
    me.name = "Name"
    stats["tris_raw"] = common.triangle_count(me)
    stats["verts_raw"] = len(me.vertices)

    bm = bmesh.new()
    bm.from_mesh(me)
    r = bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=a.merge)
    stats["merged_verts"] = stats["verts_raw"] - len(bm.verts)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(a.dissolve_deg), use_dissolve_boundaries=False,
                             verts=bm.verts, edges=bm.edges)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # deterministic, well-shaped triangles (instead of letting the exporter fan-triangulate long n-gons)
    bmesh.ops.triangulate(bm, faces=bm.faces, quad_method="BEAUTY", ngon_method="BEAUTY")

    # recentre: footprint bbox centred on origin (XY), base at z = 0
    co = np.array([v.co[:] for v in bm.verts])
    mn, mx = co.min(0), co.max(0)
    shift = Vector((-(mn[0] + mx[0]) / 2, -(mn[1] + mx[1]) / 2, -mn[2]))
    bmesh.ops.translate(bm, verts=bm.verts, vec=shift)
    bm.to_mesh(me)
    bm.free()

    me.shade_smooth()
    me.set_sharp_from_angle(angle=math.radians(a.smooth_deg))   # 4.1+ replacement for auto-smooth
    stats["tris_clean"] = common.triangle_count(me)
    stats["verts_clean"] = len(me.vertices)
    return me


def footprint_triangles(me):
    """All mesh triangles projected onto the XY plane (Blender), as an (N,3,2) array."""
    me.calc_loop_triangles()
    n = len(me.loop_triangles)
    vidx = np.empty(n * 3, dtype=np.int32)
    me.loop_triangles.foreach_get("vertices", vidx)
    co = np.empty(len(me.vertices) * 3, dtype=np.float64)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    tri = co[vidx.reshape(-1, 3)][:, :, :2]
    # drop triangles that are (nearly) vertical walls: zero projected area contributes nothing
    e1 = tri[:, 1] - tri[:, 0]
    e2 = tri[:, 2] - tri[:, 0]
    area2 = e1[:, 0] * e2[:, 1] - e1[:, 1] * e2[:, 0]
    return tri[np.abs(area2) > 1e-14]


def rasterize(tris, x_left, y_top, s, W, H, ss):
    """Supersampled coverage of the union of 2D triangles.
    Pixel (i, j) (i = column, j = row from the top) covers x in [x_left + i*s, x_left + (i+1)*s],
    y in [y_top - (j+1)*s, y_top - j*s]. Sub-samples sit at sub-pixel centres."""
    fw, fh = W * ss, H * ss
    fs = s / ss
    fine = np.zeros((fh, fw), dtype=bool)
    # continuous fine-grid coordinates of vertices: gx = (x - x_left)/fs, gy = (y_top - y)/fs
    g = np.empty_like(tris)
    g[..., 0] = (tris[..., 0] - x_left) / fs
    g[..., 1] = (y_top - tris[..., 1]) / fs
    for t in g:
        x0 = max(int(math.floor(t[:, 0].min() - 0.5)), 0)
        x1 = min(int(math.ceil(t[:, 0].max() - 0.5)), fw - 1)
        y0 = max(int(math.floor(t[:, 1].min() - 0.5)), 0)
        y1 = min(int(math.ceil(t[:, 1].max() - 0.5)), fh - 1)
        if x1 < x0 or y1 < y0:
            continue
        px = np.arange(x0, x1 + 1) + 0.5
        py = (np.arange(y0, y1 + 1) + 0.5)[:, None]
        (ax, ay), (bx, by), (cx, cy) = t
        area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
        sgn = 1.0 if area > 0 else -1.0
        w0 = sgn * ((bx - ax) * (py - ay) - (by - ay) * (px - ax))
        w1 = sgn * ((cx - bx) * (py - by) - (cy - by) * (px - bx))
        w2 = sgn * ((ax - cx) * (py - cy) - (ay - cy) * (px - cx))
        fine[y0:y1 + 1, x0:x1 + 1] |= (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
    cov = fine.reshape(H, ss, W, ss).mean(axis=(1, 3))
    return np.round(cov * 255).astype(np.uint8)


def verify_with_render(x_left, y_top, s, W, H, path):
    """Orthographic top-down Workbench render of the mesh with the same framing, flat white on black,
    'Raw' view transform so pixel values are linear coverage."""
    sc = bpy.context.scene            # the "Name" object (using `me`) is already linked
    cam_data = bpy.data.cameras.new("MaskCam")
    cam_data.type = "ORTHO"
    cam_data.sensor_fit = "HORIZONTAL"
    cam_data.ortho_scale = W * s                  # width of the view in world units
    cam_data.clip_start, cam_data.clip_end = 0.01, 100.0
    cam = bpy.data.objects.new("MaskCam", cam_data)
    cam.location = (x_left + W * s / 2, y_top - H * s / 2, 10.0)   # default camera looks down -Z, +Y up
    sc.collection.objects.link(cam)
    sc.camera = cam
    r = sc.render
    r.engine = "BLENDER_WORKBENCH"
    r.resolution_x, r.resolution_y, r.resolution_percentage = W, H, 100
    r.pixel_aspect_x = r.pixel_aspect_y = 1.0
    r.film_transparent = False
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "BW"
    r.image_settings.color_depth = "8"
    r.dither_intensity = 0.0          # default 1.0 adds +-1/255 noise to 8-bit output
    # AA 'OFF' = one sample at each pixel centre. The 8..32-sample AA patterns are not centred
    # (measured centroid bias up to -0.23 px), so they are useless for sub-pixel registration.
    sc.display.render_aa = "OFF"
    sh = sc.display.shading
    sh.light = "FLAT"
    sh.color_type = "SINGLE"
    sh.single_color = (1.0, 1.0, 1.0)
    sh.show_object_outline = False
    sh.show_cavity = False
    sh.show_shadows = False
    if sc.world is None:
        sc.world = bpy.data.worlds.new("World")
    sc.world.color = (0.0, 0.0, 0.0)
    sc.view_settings.view_transform = "Raw"
    sc.view_settings.look = "None"
    r.filepath = path
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)


def png_gray(path):
    img = bpy.data.images.load(path, check_existing=False)
    img.colorspace_settings.name = "Non-Color"
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    bpy.data.images.remove(img)
    return np.flipud(px.reshape(h, w, 4)[:, :, 0])   # Blender pixels are bottom-up


def main():
    a = common.script_args(__doc__, add_args)
    out = os.path.abspath(a.out)
    os.makedirs(out, exist_ok=True)
    T = common.Timer()
    stats = {"text": a.text, "font": os.path.basename(a.font), "params": vars(a)}

    common.reset_scene()
    text_ob = build_text(a)
    me = to_clean_mesh(text_ob, a, stats)
    bpy.data.objects.remove(text_ob)
    T.mark("build+clean")

    mat = common.principled("PEC_Metal", (0.91, 0.92, 0.92), metallic=1.0, roughness=0.18)
    me.materials.append(mat)
    ob = bpy.data.objects.new("Name", me)
    bpy.context.scene.collection.objects.link(ob)

    # ---- footprint mask ----------------------------------------------------------------------
    co = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    mn, mx = co.min(0), co.max(0)
    s = 1.0 / a.px_per_unit
    # integer pixel count, even, so the world origin falls exactly on a pixel corner
    W = int(math.ceil((mx[0] - mn[0] + 2 * a.pad) / s / 2)) * 2
    H = int(math.ceil((mx[1] - mn[1] + 2 * a.pad) / s / 2)) * 2
    x_left, y_top = -W / 2 * s, H / 2 * s
    tris = footprint_triangles(me)
    cov = rasterize(tris, x_left, y_top, s, W, H, a.ss)
    mask_png = os.path.join(out, f"{a.name}_mask.png")
    common.write_png_gray8(mask_png, W, H, cov.tobytes())
    stats["mask"] = {"width": W, "height": H, "triangles_rasterized": int(len(tris)),
                     "inside_fraction": round(float((cov >= 128).mean()), 5)}
    T.mark("mask raster")

    meta = {
        "text": a.text,
        "font": os.path.basename(a.font),
        "mask": {"file": os.path.basename(mask_png), "width": W, "height": H, "format": "PNG 8-bit gray",
                 "value": "linear coverage of the letters' top-down silhouette (union of all faces); 255 = inside metal",
                 "supersampling": a.ss * a.ss, "threshold_for_binary": 128},
        "pixel_size": s,
        "pixels_per_unit": a.px_per_unit,
        "units": "metres (Blender units; glTF units)",
        "blender": {
            "axes": "x right, y up the page (image row 0 = max y), z = extrusion height",
            "top_left_corner": [x_left, y_top],
            "pixel_to_world": "x = x_left + (i + 0.5) * s ; y = y_top - (j + 0.5) * s   (i column, j row from top)",
            "world_to_pixel": "i = (x - x_left) / s - 0.5 ; j = (y_top - y) / s - 0.5",
        },
        "gltf": {
            "axes": "glTF/three.js Y-up: x_gltf = x_bl, y_gltf = z_bl (height), z_gltf = -y_bl",
            "top_left_corner_xz": [x_left, -y_top],
            "pixel_to_world": "x = x0 + (i + 0.5) * s ; z = z0 + (j + 0.5) * s   with [x0, z0] = top_left_corner_xz",
            "world_to_uv": "u = (x - x0) / (W * s) ; v = (z - z0) / (H * s)  (v = 0 is the first PNG row; "
                           "use texture.flipY = false)",
            # continuous pixel coords (pixel edges at integers, centres at +0.5): [px, py] = M @ [x, z, 1]
            "world_to_pixel_affine_2x3": [[1 / s, 0.0, -x_left / s], [0.0, 1 / s, y_top / s]],
            "mesh_bbox_min": [float(mn[0]), float(mn[2]), float(-mx[1])],
            "mesh_bbox_max": [float(mx[0]), float(mx[2]), float(-mn[1])],
            "letters_stand_on": "y = 0 plane; letters occupy 0 <= y <= %.6f" % float(mx[2]),
            "glb_node_transform": "identity (all placement is baked into the vertex data)",
        },
    }
    common.write_json(os.path.join(out, f"{a.name}_mask.json"), meta)

    if a.verify:
        chk = os.path.join(out, f"{a.name}_mask_check.png")
        verify_with_render(x_left, y_top, s, W, H, chk)
        T.mark("verify render")
        # compare like with like: point-sample our rasterizer at pixel centres (ss=1)
        A = rasterize(tris, x_left, y_top, s, W, H, 1) >= 128
        B = png_gray(chk) >= 0.5
        inter, union = (A & B).sum(), (A | B).sum()
        ys, xs = np.nonzero(A)
        yb, xb = np.nonzero(B)
        stats["verify"] = {
            "method": "Workbench ortho render, AA off (pixel-centre samples) vs numpy point raster",
            "iou": round(float(inter / union), 6),
            "pixels_differ": int((A ^ B).sum()),
            "pixels_inside": int(A.sum()),
            "centroid_shift_px_xy": [round(float(xb.mean() - xs.mean()), 4), round(float(yb.mean() - ys.mean()), 4)],
        }
        print("[verify]", stats["verify"])

    # ---- GLB export --------------------------------------------------------------------------
    for o in bpy.context.scene.objects:
        o.select_set(o.name == "Name")
    bpy.context.view_layer.objects.active = ob
    exports = [common.gltf_export(os.path.join(out, f"{a.name}.glb"), "none")]
    if not a.no_compress:
        exports.append(common.gltf_export(os.path.join(out, f"{a.name}.draco.glb"), "draco"))
        exports.append(common.gltf_export(os.path.join(out, f"{a.name}.meshopt.glb"), "meshopt"))
    stats["exports"] = exports
    stats["glb_summary"] = common.summarize_glb(os.path.join(out, f"{a.name}.glb"))
    T.mark("export")
    stats["timings_s"] = T.marks
    stats["total_s"] = T.total()
    common.write_json(os.path.join(out, f"{a.name}_stats.json"), stats)
    print("[done] tris raw %d -> clean %d ; mask %dx%d" % (stats["tris_raw"], stats["tris_clean"], W, H))


main()
