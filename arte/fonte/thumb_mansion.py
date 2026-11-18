from lib import *
random.seed(5)
s = SVG()
s.d('''<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05030a"/><stop offset="0.45" stop-color="#1a0610"/><stop offset="0.75" stop-color="#3a0c12"/><stop offset="1" stop-color="#14040a"/></linearGradient>
<radialGradient id="moon" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#ff7a52"/><stop offset="0.55" stop-color="#d22a1a"/><stop offset="1" stop-color="#7a0a0a"/></radialGradient>
<radialGradient id="moonGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff3a20" stop-opacity="0.55"/><stop offset="0.4" stop-color="#b01010" stop-opacity="0.2"/><stop offset="1" stop-color="#600008" stop-opacity="0"/></radialGradient>
<radialGradient id="win" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#ffd890"/><stop offset="1" stop-color="#d07a2a"/></radialGradient>
<radialGradient id="winGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb060" stop-opacity="0.5"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>
<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2c8" stop-opacity="0.55"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></linearGradient>
<radialGradient id="fogBand" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#5a2a3a" stop-opacity="0.5"/><stop offset="1" stop-color="#5a2a3a" stop-opacity="0"/></radialGradient>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0508"/><stop offset="1" stop-color="#020102"/></linearGradient>''')
rim_filter(s, 'rimM', '#ff3a22', radius=2, blur=5, op=0.9)
rim_filter(s, 'rimW', '#ffb070', radius=1, blur=4, op=0.8)

s(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
for _ in range(140):
    s(f'<circle cx="{random.uniform(0,W):.0f}" cy="{random.uniform(0,520):.0f}" r="{random.uniform(0.6,1.8):.1f}" fill="#f0d8d0" opacity="{random.uniform(0.2,0.7):.2f}"/>')
# lua de sangue com crateras e nuvens passando
MX, MY, MR = 1240, 360, 250
s(f'<circle cx="{MX}" cy="{MY}" r="{MR*2.2}" fill="url(#moonGlow)"/>')
s(f'<circle cx="{MX}" cy="{MY}" r="{MR}" fill="url(#moon)"/>')
for cx, cy, r in ((-80, -60, 46), (60, 40, 30), (-20, 110, 22), (110, -90, 26), (-130, 60, 18), (30, -150, 14)):
    s(f'<circle cx="{MX+cx}" cy="{MY+cy}" r="{r}" fill="#8a1a10" opacity="0.35"/>')
s.d('<radialGradient id="cloud" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#12040a" stop-opacity="0.95"/><stop offset="0.7" stop-color="#12040a" stop-opacity="0.6"/><stop offset="1" stop-color="#12040a" stop-opacity="0"/></radialGradient>')
for cx, cy, rx, ry in ((1000, 312, 260, 34), (1230, 318, 220, 28), (1450, 305, 240, 32), (1140, 430, 230, 24), (1380, 438, 260, 26), (1500, 250, 180, 20), (900, 440, 160, 18)):
    for k in range(3):
        s(f'<ellipse cx="{cx + random.uniform(-60, 60):.0f}" cy="{cy + random.uniform(-8, 8):.0f}" rx="{rx * random.uniform(0.5, 0.9):.0f}" ry="{ry * random.uniform(0.8, 1.3):.0f}" fill="url(#cloud)"/>')
# colina e mansão
s('<path d="M 0 760 Q 500 690 960 700 T 1920 720 L 1920 1080 L 0 1080 Z" fill="url(#ground)"/>')
M = '#07030a'
base = 760
def rect(x, y, w, h, f=M): s(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{f}"/>')
s('<g filter="url(#rimM)">')
rect(820, 470, 860, 300)           # corpo principal
s(f'<polygon points="800,475 1250,330 1700,475" fill="{M}"/>')   # telhado
rect(1140, 300, 140, 200)          # torre
s(f'<polygon points="1120,305 1210,120 1300,305" fill="{M}"/>')  # agulha da torre
s(f'<line x1="1210" y1="120" x2="1210" y2="80" stroke="{M}" stroke-width="6"/>')
rect(700, 560, 160, 210)           # ala esquerda
s(f'<polygon points="680,565 780,480 880,565" fill="{M}"/>')
rect(1640, 540, 170, 230)          # ala direita
s(f'<polygon points="1620,545 1725,450 1830,545" fill="{M}"/>')
for x in (930, 1560): rect(x, 380, 34, 110)   # chaminés
s('</g>')
# janelas (escuras, com moldura) — uma acesa com o Blinder dentro
wins = []
for row, y in enumerate((520, 640)):
    for x in range(870, 1640, 95):
        if 1150 <= x <= 1270 and row == 1: continue
        wins.append((x, y))
for x, y in wins: s(f'<rect x="{x}" y="{y}" width="46" height="70" fill="#1a0a10" stroke="#2a141a" stroke-width="4"/><line x1="{x+23}" y1="{y}" x2="{x+23}" y2="{y+70}" stroke="#2a141a" stroke-width="3"/>')
s('<rect x="1182" y="340" width="56" height="90" fill="#1a0a10" stroke="#2a141a" stroke-width="4"/>')
# janela acesa
LX, LY = 1345, 520
s(f'<ellipse cx="{LX+23}" cy="{LY+35}" rx="140" ry="120" fill="url(#winGlow)"/>')
s(f'<rect x="{LX}" y="{LY}" width="46" height="70" fill="url(#win)"/>')
s.d(f'<clipPath id="winClip"><rect x="{LX}" y="{LY}" width="46" height="70"/></clipPath>')
s('<g clip-path="url(#winClip)">')
blinder(s, LX + 24, LY + 176, 165, tilt=0.45, fill='#0a0204', fingers=False, blindfold='#e8dcc0')
s('</g>')
s(f'<rect x="{LX}" y="{LY}" width="46" height="70" fill="none" stroke="#2a141a" stroke-width="5"/><line x1="{LX+23}" y1="{LY}" x2="{LX+23}" y2="{LY+70}" stroke="#2a141a" stroke-width="3"/>')
# porta aberta com escuridão
s('<path d="M 1180 770 L 1180 690 Q 1210 660 1240 690 L 1240 770 Z" fill="#000"/>')
s('<path d="M 1240 690 L 1262 700 L 1262 776 L 1240 770 Z" fill="#1a0a10"/>')

# árvores mortas
def branch(x, y, ang, ln, w, d):
    x2, y2 = x + math.cos(ang) * ln, y + math.sin(ang) * ln
    s(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#030103" stroke-width="{w:.1f}" stroke-linecap="round"/>')
    if d > 0:
        for _ in range(2 if d < 4 else 3):
            branch(x2, y2, ang + random.uniform(-0.7, 0.7), ln * random.uniform(0.6, 0.78), w * 0.62, d - 1)
branch(140, 1080, -math.pi/2 - 0.12, 300, 30, 6)
branch(1830, 1080, -math.pi/2 + 0.18, 260, 26, 6)
# cerca de ferro
s('<rect x="0" y="820" width="1920" height="8" fill="#050205"/><rect x="0" y="880" width="1920" height="6" fill="#050205"/>')
for x in range(10, 1920, 38):
    if 1120 < x < 1330: continue
    s(f'<rect x="{x}" y="790" width="7" height="130" fill="#050205"/><polygon points="{x-5},792 {x+3.5},770 {x+12},792" fill="#050205"/>')
# portão aberto (torto)
s('<g transform="rotate(-18 1120 920)">' + ''.join(f'<rect x="{1120 - i*30}" y="770" width="7" height="150" fill="#050205"/>' for i in range(1, 5)) + '<rect x="1000" y="800" width="128" height="7" fill="#050205"/></g>')
# corvos na cerca
for cx in (420, 455, 1520):
    s(f'<path d="M {cx} 818 q 6 -18 18 -16 q 8 -10 14 2 l 10 4 l -10 2 q -6 14 -24 10 Z" fill="#050205"/>')
# névoa rasteira
for cx, cy, rx, ry in ((400, 900, 700, 120), (1300, 880, 800, 110), (960, 980, 1100, 140)):
    s(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#fogBand)"/>')

# jogador de costas com lanterna (primeiro plano, à esquerda)
PX, PY, K = 520, 1080, 1.0
def pr(x, y, w, h, rx=6, f='#050306'): s(f'<rect x="{PX+x}" y="{PY-y}" width="{w}" height="{h}" rx="{rx}" fill="{f}"/>')
s(f'<polygon points="{PX+120},{PY-330} {PX+130},{PY-300} 1240,700 1170,620" fill="url(#beam)"/>')
s('<g filter="url(#rimM)">')
pr(-70, 200, 60, 200); pr(10, 200, 60, 200)        # pernas
pr(-80, 400, 160, 205, 10)                          # tronco
pr(-60, 520, 120, 120, 14)                          # cabeça
pr(-130, 395, 52, 180, 12)                          # braço esquerdo (martelo)
pr(78, 400, 52, 150, 12)                            # braço direito estendido
s(f'<rect x="{PX+80}" y="{PY-360}" width="60" height="22" rx="6" fill="#151216" transform="rotate(-28 {PX+80} {PY-360})"/>')
s(f'<rect x="{PX-118}" y="{PY-220}" width="12" height="150" fill="#2a1a10"/><rect x="{PX-150}" y="{PY-80}" width="76" height="34" rx="4" fill="#1a1a1e"/>')
s('</g>')
s(f'<circle cx="{PX+135}" cy="{PY-338}" r="10" fill="#fff6d8"/>')

title(s, 70, 230, 210)
tagline(s, 80, 320, 'NÃO FAÇA BARULHO.', 44, red='BARULHO.')
finish(s, grit=0.12)
s.save('thumb_mansion.svg')
