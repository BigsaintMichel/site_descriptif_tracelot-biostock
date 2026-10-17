"""Construit deux sorties à partir de src/ :
- dist/        : site déployable (index.html + css/ + js/ + img/)
- artifact/    : une page autonome (tout en ligne) pour la publication en ligne
"""
import base64
import os
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, IMG = ROOT / "src", ROOT / "assets" / "img"
DIST, ART = ROOT / "dist", ROOT / "artifact"
GSAP = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/"

npx = "npx.cmd" if os.name == "nt" else "npx"
subprocess.run([npx, "tailwindcss", "-c", "tailwind.config.js", "-i", "src/styles.css",
                "-o", "build/app.css", "--minify"], cwd=ROOT, check=True, capture_output=True)
css = (ROOT / "build" / "app.css").read_text()
page = (SRC / "page.html").read_text()
main_js = (SRC / "main.js").read_text()
scenes_js = (SRC / "scenes.js").read_text()
head, body = page.split("<!--@BODY-->")

libs = (f'<script src="{GSAP}gsap.min.js"></script>\n'
        f'<script src="{GSAP}ScrollTrigger.min.js"></script>\n')

# ---- dist/ ----
if DIST.exists():
    shutil.rmtree(DIST)
(DIST / "css").mkdir(parents=True)
(DIST / "js").mkdir()
shutil.copytree(IMG, DIST / "img")
(DIST / "css" / "app.css").write_text(css)
(DIST / "js" / "main.js").write_text(main_js)
(DIST / "js" / "scenes.js").write_text(scenes_js)
d_head = head.replace("<!--@CSS-->", '<link rel="stylesheet" href="css/app.css">')
d_body = body.replace("<!--@SCRIPTS-->", libs + '<script src="js/main.js"></script>\n'
                      '<script type="module" src="js/scenes.js"></script>')
(DIST / "index.html").write_text(
    '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + d_head.strip() + "\n</head>\n<body>\n" + d_body.strip() + "\n</body>\n</html>\n")

# ---- artifact/ ----
ART.mkdir(exist_ok=True)
a = page.replace("<!--@CSS-->", "<style>" + css + "</style>").replace("<!--@BODY-->", "")
a = a.replace("<!--@SCRIPTS-->", libs + "<script>\n" + main_js + "\n</script>\n<script type=\"module\">\n" + scenes_js + "\n</script>")
for f in IMG.glob("*.png"):
    uri = "data:image/png;base64," + base64.b64encode(f.read_bytes()).decode()
    a = a.replace(f"img/{f.name}", uri)
out = ART / "tracelot-biostock.html"
out.write_text(a)
print("dist ok ·", "artifact", round(out.stat().st_size / 1024), "Ko")
