"""Convert the existing framed Ink Set artwork into transparent symbol-only PNGs.
Run from the repository root. Preserves original WEBP files as rollback assets.
"""
from pathlib import Path
from PIL import Image
import numpy as np
import re

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "assets" / "ink-sets"
NAMES = ("combat", "dragon", "flames", "frost", "grace", "guidance",
         "might", "protection", "resonance", "thunder", "water")

for name in NAMES:
    source = Image.open(ICONS / f"ink-{name}.webp").convert("RGB")
    w, h = source.size
    # Exclude the embedded gold border before isolating the colored symbol.
    source = source.crop((round(w*.16), round(h*.16), round(w*.84), round(h*.84)))
    rgb = np.asarray(source, dtype=np.float32)
    high = rgb.max(axis=2)
    low = rgb.min(axis=2)
    saturation = (high-low)/(high+1)
    alpha = np.clip((saturation-.09)/.21, 0, 1)*np.clip((high-25)/65, 0, 1)
    pixels = np.concatenate((rgb.astype("uint8"), (alpha*255).astype("uint8")[:,:,None]), axis=2)
    symbol = Image.fromarray(pixels, "RGBA")
    bounds = symbol.getchannel("A").point(lambda v: 255 if v>18 else 0).getbbox()
    if not bounds:
        raise RuntimeError(f"No symbol detected for {name}")
    symbol = symbol.crop(bounds)
    symbol.thumbnail((92, 92), Image.Resampling.LANCZOS)
    tile = Image.new("RGBA", (120, 120), (0,0,0,0))
    tile.alpha_composite(symbol, ((120-symbol.width)//2, (120-symbol.height)//2))
    tile.save(ICONS / f"ink-{name}.png", optimize=True)
    print("Created transparent symbol:", name)

page = ROOT / "builder" / "index.html"
html = page.read_text(encoding="utf-8")
for name in NAMES:
    old = f"../assets/ink-sets/ink-{name}.webp"
    new = f"../assets/ink-sets/ink-{name}.png"
    if old not in html:
        raise RuntimeError(f"Missing existing icon reference: {old}")
    html = html.replace(old, new)
# Keep one site-defined frame, never the embedded artwork border.
start = html.index('<style id="ink-optical-alignment">')
end = html.index("</style>", start) + len("</style>")
style = """<style id="ink-optical-alignment">
/* Transparent symbol artwork, framed once by the Builder. */
.ink-set-icon{box-sizing:border-box!important;display:inline-flex!important;
align-items:center;justify-content:center;overflow:hidden;vertical-align:middle;
border:1px solid #9b6946!important;border-radius:9px!important;
padding:3px!important;background:#171315!important;
box-shadow:0 2px 6px #0008!important}
.ink-set-icon>img{display:block;width:100%;height:100%;min-width:0;
object-fit:contain;object-position:center;flex:none;transform:none!important}
</style>"""
html = html[:start] + style + html[end:]
page.write_text(html, encoding="utf-8")
print("Updated Builder to use transparent PNG icons.")
