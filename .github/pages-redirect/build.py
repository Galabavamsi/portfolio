"""Build the GitHub Pages site for galabavamsi.github.io/portfolio as redirects only.

The real site lives at https://galabavamsi.com (Vercel). Links sent out earlier
point at galabavamsi.github.io/portfolio/..., so every page here forwards to the
same path on the new domain:
  - each .html page gets a stub with a canonical link, a meta refresh and a JS
    redirect that keeps the query string and #hash (e.g. #film);
  - 404.html catches everything else (PDFs, images, old paths) and forwards the
    path with the /portfolio prefix removed.
Run from the repo root; writes .site/.
"""
import os

TARGET = "https://galabavamsi.com"
SKIP_DIRS = {".git", ".site", ".github", "experiments", "node_modules", "supabase", "applications"}


def stub(path: str) -> str:
    url = f"{TARGET}/{path}" if path else f"{TARGET}/"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Moved to galabavamsi.com</title>
  <link rel="canonical" href="{url}">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url={url}">
  <script>location.replace("{url}" + location.search + location.hash);</script>
</head>
<body>
  <p>This site moved to <a href="{url}">{url}</a>.</p>
</body>
</html>
"""


CATCH_ALL = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Moved to galabavamsi.com</title>
  <meta name="robots" content="noindex">
  <script>
    var path = location.pathname.replace(/^\\/portfolio\\/?/, "");
    location.replace("{TARGET}/" + path + location.search + location.hash);
  </script>
</head>
<body>
  <p>This site moved to <a href="{TARGET}/">{TARGET}</a>.</p>
</body>
</html>
"""

count = 0
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for name in files:
        if not name.endswith(".html"):
            continue
        rel = os.path.relpath(os.path.join(root, name), ".").replace(os.sep, "/")
        out = os.path.join(".site", rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(stub("" if rel == "index.html" else rel))
        count += 1

os.makedirs(".site", exist_ok=True)
with open(os.path.join(".site", "404.html"), "w", encoding="utf-8") as fh:
    fh.write(CATCH_ALL)
print(f"wrote {count} redirect pages + 404.html")
