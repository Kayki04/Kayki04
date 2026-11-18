"""Gera o cartaz e o QR Code de divulgação do app. Uso: python3 tools/make_flyer.py [link]"""
import base64, io, os, re, sys
import qrcode
from PIL import Image, ImageDraw, ImageFont
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://gatecao.com.br'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'divulgacao')
html = open(os.path.join(ROOT, 'gatecao.html'), encoding='utf8').read()
logo = Image.open(io.BytesIO(base64.b64decode(re.search(r'class="logoimg" src="data:image/png;base64,([^"]+)"', html).group(1)))).convert('RGBA')
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf'
def font(sz, b=True): return ImageFont.truetype(F % ('-Bold' if b else ''), sz)
NAVY, ORANGE, SOFT = (11, 42, 91), (255, 122, 0), (255, 241, 226)

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=20, border=2)
qr.add_data(URL); qr.make(fit=True)
q = qr.make_image(fill_color=NAVY, back_color='white').convert('RGB')
q.save(os.path.join(OUT, 'qrcode-app-gatecao.png'))

W, H = 1240, 1754  # A5/A4 em 150 dpi
im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im)
d.rectangle([0, 292, W, 300], fill=ORANGE)
lw = 640; lg = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)
im.paste(lg, ((W - lw) // 2, 150 - lg.height // 2), lg)
def center(y, t, f, c=NAVY):
    w = d.textlength(t, font=f); d.text(((W - w) / 2, y), t, font=f, fill=c)
center(350, 'Baixe o app da Gatecão', font(76))
center(450, 'e cuide do seu pet pelo celular', font(46, False), (94, 111, 142))
y = 560
for t in ['Ração e petiscos com entrega', 'Agende banho e tosa em 1 minuto', 'Lembrete da ração, vacina e banho', 'Ganhe pontos e cashback no clube']:
    d.ellipse([200, y + 10, 236, y + 46], fill=ORANGE); d.text((260, y), t, font=font(44, False), fill=NAVY); y += 78
qs = 480; qq = q.resize((qs, qs), Image.NEAREST)
d.rounded_rectangle([(W - qs) // 2 - 24, y + 30, (W + qs) // 2 + 24, y + 30 + qs + 48], radius=36, outline=ORANGE, width=8)
im.paste(qq, ((W - qs) // 2, y + 54))
y += qs + 100
center(y, 'Aponte a câmera do celular', font(46)); y += 62
center(y, URL.replace('https://', ''), font(40, False), (94, 111, 142)); y += 90
d.rectangle([0, H - 150, W, H], fill=NAVY)
center(H - 118, 'No iPhone: Compartilhar  >  Adicionar à Tela de Início', font(36, False), (255, 255, 255))
center(H - 70, 'No Android: menu  >  Instalar app', font(36, False), (255, 255, 255))
im.save(os.path.join(OUT, 'cartaz-app-gatecao.png'), dpi=(150, 150))
im.save(os.path.join(OUT, 'cartaz-app-gatecao.pdf'), resolution=150)
print('ok', URL)
