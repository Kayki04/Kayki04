"""Gera a versão Firebase do app (pasta public/) a partir de gatecao.html.

Uso: python3 tools/build_firebase.py
O mesmo gatecao.html continua sendo o app publicado no Claude.
"""
import base64, io, json, os, re, shutil, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'gatecao.html')
OUT = os.path.join(ROOT, 'public')
FB = os.path.join(ROOT, 'firebase')
SDK = '10.14.1'

cfg = open(os.path.join(FB, 'config.js'), encoding='utf8').read()
bucket = re.search(r'storageBucket:\s*"([^"]+)"', cfg).group(1)
html = open(SRC, encoding='utf8').read()

# Fotos: o app usa "/_blob/<id>"; no Firebase elas ficam no Storage.
html = html.replace('/_blob/', 'https://firebasestorage.googleapis.com/v0/b/%s/o/assets%%2F' % bucket)

DESC = 'Ração, petiscos, farmácia, brinquedos e banho & tosa com entrega. Clube de pontos e cashback no app da Gatecão Pet Shop.'
head = ('<meta name="theme-color" content="#FF7A00">'
        '<meta name="apple-mobile-web-app-capable" content="yes">'
        '<meta name="apple-mobile-web-app-title" content="Gatecão">'
        '<meta name="apple-mobile-web-app-status-bar-style" content="default">'
        '<meta name="description" content="' + DESC + '">'
        '<meta property="og:type" content="website">'
        '<meta property="og:site_name" content="Gatecão Pet Shop">'
        '<meta property="og:title" content="Gatecão Pet Shop">'
        '<meta property="og:description" content="' + DESC + '">'
        '<meta property="og:url" content="https://gatecao.com.br/">'
        '<meta property="og:image" content="https://gatecao.com.br/icons/og.png?v=' + str(int(time.time())) + '">'
        '<meta property="og:image:width" content="1200">'
        '<meta property="og:image:height" content="630">'
        '<meta name="twitter:card" content="summary_large_image">'
        '<meta name="twitter:title" content="Gatecão Pet Shop">'
        '<meta name="twitter:description" content="' + DESC + '">'
        '<meta name="twitter:image" content="https://gatecao.com.br/icons/og.png">'
        '<link rel="manifest" href="/manifest.webmanifest">'
        '<link rel="icon" href="/icons/icon-192.png">'
        '<link rel="apple-touch-icon" href="/icons/icon-180.png">')
html = html.replace('</head>', head + '</head>', 1)

sdk = ''.join('<script src="https://www.gstatic.com/firebasejs/%s/firebase-%s-compat.js"></script>' % (SDK, m)
              for m in ('app', 'auth', 'firestore', 'storage', 'messaging', 'functions'))
VER = str(int(time.time()))
shim = sdk + '<script src="/config.js?v=' + VER + '"></script><script src="/shim.js?v=' + VER + '"></script>\n'
i = html.index('<script>')
html = html[:i] + shim + html[i:]

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(os.path.join(OUT, 'icons'))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(html)
for f in ('shim.js', 'config.js', 'sw.js', 'manifest.webmanifest'):
    shutil.copy(os.path.join(FB, f), os.path.join(OUT, f))

# Ícones a partir do logo que já está no app.
m = re.search(r'class="logoimg" src="data:image/png;base64,([^"]+)"', html)
if m:
    from PIL import Image
    logo = Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGBA')
    def icon(size, pad, bg=(255, 255, 255, 255)):
        im = Image.new('RGBA', (size, size), bg)
        w = int(size * (1 - 2 * pad)); h = int(logo.height * w / logo.width)
        lg = logo.resize((w, h), Image.LANCZOS)
        im.alpha_composite(lg, ((size - w) // 2, (size - h) // 2))
        return im.convert('RGB')
    icon(192, .08).save(os.path.join(OUT, 'icons', 'icon-192.png'))
    icon(512, .08).save(os.path.join(OUT, 'icons', 'icon-512.png'))
    icon(512, .18).save(os.path.join(OUT, 'icons', 'icon-maskable.png'))
    icon(180, .08).save(os.path.join(OUT, 'icons', 'icon-180.png'))
    # Imagem de compartilhamento (WhatsApp/Facebook/Twitter): 1200x630 laranja com o logo.
    try:
        from PIL import ImageDraw, ImageFont
        W, H = 1200, 630
        og = Image.new('RGB', (W, H), (255, 122, 0))
        px = og.load()
        for y in range(H):  # degradê vertical laranja -> laranja escuro
            t = y / H
            r = int(255 - 40 * t); g = int(122 - 50 * t); b = int(0 + 10 * t)
            for x in range(W):
                px[x, y] = (r, g, b)
        # logo centralizado em um cartão branco arredondado
        card = 300
        cx, cy = (W - card) // 2, 120
        draw = ImageDraw.Draw(og)
        draw.rounded_rectangle([cx, cy, cx + card, cy + card], radius=48, fill=(255, 255, 255))
        lw = int(card * .78); lh = int(logo.height * lw / logo.width)
        lg = logo.resize((lw, lh), Image.LANCZOS)
        og.paste(lg.convert('RGB'), (cx + (card - lw) // 2, cy + (card - lh) // 2), lg)
        # texto
        def font(sz):
            for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
                if os.path.exists(p):
                    return ImageFont.truetype(p, sz)
            return ImageFont.load_default()
        def center(txt, y, f, fill=(255, 255, 255)):
            w = draw.textbbox((0, 0), txt, font=f)[2]
            draw.text(((W - w) // 2, y), txt, font=f, fill=fill)
        center('Gatecão Pet Shop', 450, font(64))
        center('Ração, farmácia, banho & tosa com entrega', 530, font(30), (255, 235, 215))
        og.save(os.path.join(OUT, 'icons', 'og.png'), quality=90)
    except Exception as e:
        print('og.png pulado:', e)
print('public/ pronto:', len(html) // 1024, 'KB')
