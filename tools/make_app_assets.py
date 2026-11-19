"""Gera as imagens-fonte (assets/) para o @capacitor/assets: ícone e splash do app."""
import base64, io, os, re
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(ROOT, 'gatecao.html'), encoding='utf8').read()
m = re.search(r'class="logoimg" src="data:image/png;base64,([^"]+)"', html)
if not m:
    raise SystemExit('logo não encontrado')
logo = Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGBA')
OUT = os.path.join(ROOT, 'assets')
os.makedirs(OUT, exist_ok=True)
ORANGE = (255, 122, 0, 255)

def place(canvas, frac):
    w = int(canvas.width * frac)
    h = int(logo.height * w / logo.width)
    lg = logo.resize((w, h), Image.LANCZOS)
    canvas.alpha_composite(lg, ((canvas.width - w) // 2, (canvas.height - h) // 2))
    return canvas

# Ícone: logo sobre fundo branco arredondado (1024). Também a versão foreground p/ adaptativo.
icon = Image.new('RGBA', (1024, 1024), (255, 255, 255, 255))
place(icon, 0.72).convert('RGB').save(os.path.join(OUT, 'icon.png'))
# Foreground (logo) sobre transparente + background laranja para ícone adaptativo Android
fg = place(Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)), 0.60)
fg.save(os.path.join(OUT, 'icon-foreground.png'))
Image.new('RGBA', (1024, 1024), ORANGE).convert('RGB').save(os.path.join(OUT, 'icon-background.png'))
# Splash 2732x2732 laranja com o logo branco-cartão no centro
for name in ('splash.png', 'splash-dark.png'):
    sp = Image.new('RGBA', (2732, 2732), ORANGE)
    card = 760
    cx = (2732 - card) // 2
    from PIL import ImageDraw
    d = ImageDraw.Draw(sp)
    d.rounded_rectangle([cx, cx, cx + card, cx + card], radius=130, fill=(255, 255, 255, 255))
    w = int(card * 0.74); h = int(logo.height * w / logo.width)
    lg = logo.resize((w, h), Image.LANCZOS)
    sp.alpha_composite(lg, ((2732 - w) // 2, (2732 - h) // 2))
    sp.convert('RGB').save(os.path.join(OUT, name))
print('assets/ gerado:', os.listdir(OUT))
