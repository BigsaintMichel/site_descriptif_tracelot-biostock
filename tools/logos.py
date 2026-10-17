"""Détoure les logos fournis (fond bleu nuit -> transparent) et découpe les marques."""
import sys
from pathlib import Path
from PIL import Image
import numpy as np

UP = Path("/mnt/user-data/uploads")
OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)


def key_out(img, bg, soft=60.0):
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    b = np.array(bg, dtype=np.float32)
    d = np.abs(a - b).max(axis=2)
    alpha = np.clip((d - 6) / soft, 0, 1)
    safe = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((a - b * (1 - alpha[..., None])) / safe, 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def crop_save(im, box, name, width):
    c = im.crop(box)
    bbox = c.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    c = c.crop(bbox)
    h = round(c.height * width / c.width)
    c = c.resize((width, h), Image.LANCZOS)
    c.save(OUT / f"{name}.png", optimize=True)
    print(name, c.size)


bs = key_out(Image.open(UP / "Logo_BioStock_émeraude_et_blanc.png"), (4, 20, 44))
crop_save(bs, (380, 240, 880, 820), "biostock-mark", 220)
crop_save(bs, (230, 840, 1030, 1010), "biostock-word", 360)

combo = key_out(Image.open(UP / "Logo_TraceLot__BioStock_en_boucle_verte.png"), (5, 21, 44))
crop_save(combo, (360, 240, 900, 780), "tlbs-mark", 200)

tl = key_out(Image.open(UP / "logo_store.png"), (8, 12, 26))
crop_save(tl, (350, 290, 900, 670), "tracelot-mark", 220)
crop_save(tl, (200, 690, 1060, 870), "tracelot-word", 360)
