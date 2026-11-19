"""Launcher icon: gradient tile + serif monogram. Theme-aware so it can follow the chosen design."""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'build', 'icons')
FONT = '/mnt/skills/examples/canvas-design/canvas-fonts/InstrumentSerif-Regular.ttf'

THEMES = {
    'noir':      dict(bg=((22, 21, 19), (6, 6, 7)), fg=((246, 228, 186), (184, 147, 90)), font=FONT),
    'porcelain': dict(bg=((40, 42, 48), (8, 8, 10)), fg=((255, 255, 255), (214, 216, 222)), font='/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'),
    'azure':     dict(bg=((34, 166, 238), (0, 74, 121)), fg=((255, 255, 255), (220, 238, 250)), font='/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'),
    'glass':     dict(bg=((45, 149, 255), (94, 92, 230)), fg=((255, 255, 255), (232, 236, 255)), font='/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'),
    'aura':      dict(bg=((200, 212, 255), (246, 208, 226)), fg=((46, 46, 52), (20, 20, 22)), font='/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'),
    'aurora':    dict(bg=((22, 18, 64), (5, 8, 28)), fg=((170, 150, 255), (62, 214, 255)), font='/mnt/skills/examples/canvas-design/canvas-fonts/Outfit-Bold.ttf'),
}


def lin(size, c1, c2, angle_diag=True):
    w, h = size
    g = Image.new('RGB', size)
    px = g.load()
    for y in range(h):
        for x in range(w):
            t = ((x + y) / (w + h - 2)) if angle_diag else y / (h - 1)
            px[x, y] = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
    return g


def glyph(size, theme, scale):
    t = THEMES[theme]
    S = size
    mask = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(mask)
    fs = int(S * scale)
    f = ImageFont.truetype(t['font'], fs)
    bbox = d.textbbox((0, 0), 'S', font=f)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((S - w) / 2 - bbox[0], (S - h) / 2 - bbox[1]), 'S', font=f, fill=255)
    grad = lin((S, S), t['fg'][0], t['fg'][1])
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def background(size, theme):
    t = THEMES[theme]
    bg = lin((size, size), t['bg'][0], t['bg'][1]).convert('RGBA')
    # soft sheen
    sheen = Image.new('L', (size, size), 0)
    ImageDraw.Draw(sheen).ellipse((-size * .3, -size * .55, size * .9, size * .45), fill=60)
    sheen = sheen.filter(ImageFilter.GaussianBlur(size / 8))
    white = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    bg = Image.composite(white, bg, sheen)
    return bg


def make(theme='noir'):
    os.makedirs(OUT, exist_ok=True)
    A = 432
    background(A, theme).convert('RGB').save(os.path.join(OUT, 'ic_launcher_background.png'), optimize=True)
    glyph(A, theme, 0.42 if theme == 'noir' else 0.34).save(os.path.join(OUT, 'ic_launcher_foreground.png'), optimize=True)
    # legacy rounded tile at 4x then downsample
    L = 768
    tile = background(L, theme)
    g = glyph(L, theme, 0.62 if theme == 'noir' else 0.5)
    tile.alpha_composite(g)
    m = Image.new('L', (L, L), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, L - 1, L - 1), radius=int(L * 0.23), fill=255)
    tile.putalpha(m)
    tile.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, 'ic_launcher.png'), optimize=True)
    tile.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, 'icon_512.png'))


if __name__ == '__main__' and (len(sys.argv) < 2 or sys.argv[1] != 'halo'):
    make(sys.argv[1] if len(sys.argv) > 1 else 'noir')


# ───────── Halo icon (OneFI): pastel rim, graphite squircle, one soft dot ─────────
import numpy as np
RIM = [(198, 204, 242), (179, 185, 223), (226, 204, 224), (191, 221, 211), (198, 204, 242)]


def conic(size, start=210):
    y, x = np.mgrid[0:size, 0:size]
    a = (np.degrees(np.arctan2(y - size / 2, x - size / 2)) + 90 - start) % 360 / 360 * (len(RIM) - 1)
    i = np.floor(a).astype(int); f = (a - i)[..., None]
    c = np.array(RIM, float)
    img = c[i] * (1 - f) + c[np.minimum(i + 1, len(RIM) - 1)] * f
    return Image.fromarray(img.astype('uint8'), 'RGB').convert('RGBA')


def graphite(size):
    y, x = np.mgrid[0:size, 0:size]
    d = np.sqrt(((x - size / 2) / (size * 1.3)) ** 2 + ((y + size * .14) / (size * 1.2)) ** 2)
    t = np.clip(d, 0, 1)[..., None]
    a, b, c = np.array([59, 59, 67.]), np.array([31, 31, 36.]), np.array([21, 21, 24.])
    img = np.where(t < .54, a + (b - a) * (t / .54), b + (c - b) * ((t - .54) / .46))
    return Image.fromarray(img.astype('uint8'), 'RGB').convert('RGBA')


def squircle_mask(size, box, r):
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle(box, radius=r, fill=255)
    return m


def dot(canvas, cx, cy, r):
    S = canvas.size[0]
    glow = Image.new('L', (S, S), 0)
    ImageDraw.Draw(glow).ellipse((cx - r * 2.2, cy - r * 2.2, cx + r * 2.2, cy + r * 2.2), fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(r * 1.1))
    canvas.alpha_composite(Image.merge('RGBA', [Image.new('L', (S, S), 214), Image.new('L', (S, S), 220), Image.new('L', (S, S), 255), glow]))
    d = ImageDraw.Draw(canvas)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255, 240))


def halo_tile(S, inset, radius_k=.32):
    """Full halo at size S: rim fills the tile, graphite core inset."""
    rim = conic(S)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.paste(rim, (0, 0), squircle_mask(S, (0, 0, S - 1, S - 1), int(S * radius_k)))
    i = int(S * inset)
    core = graphite(S - 2 * i)
    m = squircle_mask(S - 2 * i, (0, 0, S - 2 * i - 1, S - 2 * i - 1), int((S - 2 * i) * .29))
    out.paste(core, (i, i), m)
    return out


def make_halo():
    os.makedirs(OUT, exist_ok=True)
    A = 432
    # adaptive: background is the pastel rim, foreground is the graphite core with the dot
    conic(A).convert('RGB').save(os.path.join(OUT, 'ic_launcher_background.png'), optimize=True)
    fg = Image.new('RGBA', (A, A), (0, 0, 0, 0))
    k = int(A * .25)  # core spans the middle 50% (inside the 66% safe zone, leaving a rim on any mask)
    core = graphite(A - 2 * k)
    fg.paste(core, (k, k), squircle_mask(A - 2 * k, (0, 0, A - 2 * k - 1, A - 2 * k - 1), int((A - 2 * k) * .3)))
    dot(fg, A / 2, A / 2, A * .024)
    fg.save(os.path.join(OUT, 'ic_launcher_foreground.png'), optimize=True)
    L = 768
    tile = halo_tile(L, .06)
    dot(tile, L / 2, L / 2, L * .045)
    tile.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, 'ic_launcher.png'), optimize=True)
    tile.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, 'icon_512.png'))


if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == 'halo':
    make_halo()
