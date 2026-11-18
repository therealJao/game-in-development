from lib import *
random.seed(31)
s = SVG()
s.d('''<linearGradient id="room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06090d"/><stop offset="0.6" stop-color="#0a1016"/><stop offset="1" stop-color="#030405"/></linearGradient>
<radialGradient id="lamp" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#cfe2ff" stop-opacity="0.55"/><stop offset="0.5" stop-color="#8fb0e0" stop-opacity="0.12"/><stop offset="1" stop-color="#8fb0e0" stop-opacity="0"/></radialGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14171a"/><stop offset="0.5" stop-color="#0c0e10"/><stop offset="1" stop-color="#050607"/></linearGradient>
<filter id="scratch" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.002 0.35" numOctaves="2" seed="8"/><feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.65  0 0 0 0 0.7  0 0 0 -9 6.2"/></filter>
<radialGradient id="redGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff2414" stop-opacity="0.55"/><stop offset="0.45" stop-color="#c01008" stop-opacity="0.22"/><stop offset="1" stop-color="#600004" stop-opacity="0"/></radialGradient>
<radialGradient id="coldGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#8aa2c0" stop-opacity="0.16"/><stop offset="1" stop-color="#8aa2c0" stop-opacity="0"/></radialGradient>
<radialGradient id="bulb" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d8e8ff" stop-opacity="0.7"/><stop offset="1" stop-color="#d8e8ff" stop-opacity="0"/></radialGradient>
<radialGradient id="breath" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e8eef5" stop-opacity="0.18"/><stop offset="1" stop-color="#e8eef5" stop-opacity="0"/></radialGradient>''')
rim_filter(s, 'rimCold', '#ff4a30', radius=2, blur=6, op=0.95)
fog_filter(s, 'fogC', (0.25, 0.3, 0.38), seed=7)

# ===== lado de fora (visto pelas frestas) =====
s(f'<rect width="{W}" height="{H}" fill="url(#room)"/>')
# parede do fundo com papel de parede listrado e um quadro torto
for i in range(0, W, 46):
    s(f'<rect x="{i}" y="0" width="22" height="{H}" fill="#121a22" opacity="0.22"/>')
s('<rect x="300" y="250" width="180" height="230" fill="#0a0e12" stroke="#2a3540" stroke-width="10" transform="rotate(-6 390 365)"/>')
# porta ao fundo, entreaberta, escura
s('<rect x="560" y="200" width="250" height="560" fill="#06080a"/><rect x="560" y="200" width="250" height="560" fill="none" stroke="#24303a" stroke-width="14"/>')
s('<polygon points="810,200 900,230 900,740 810,760" fill="#141c24"/>')
# lâmpada fria pendurada atrás dele
s('<line x1="1390" y1="0" x2="1390" y2="120" stroke="#222" stroke-width="4"/><ellipse cx="1390" cy="130" rx="38" ry="12" fill="#1c2228"/><circle cx="1390" cy="142" r="12" fill="#eaf3ff"/>')
s('<circle cx="1390" cy="142" r="110" fill="url(#bulb)"/>')
s('<polygon points="1370,150 1410,150 1800,1080 980,1080" fill="url(#lamp)"/>')
s('<ellipse cx="1250" cy="700" rx="760" ry="320" fill="url(#coldGlow)"/>')
# luz vermelha de emergência vindo da esquerda
s('<ellipse cx="270" cy="420" rx="420" ry="360" fill="url(#redGlow)"/>')
s('<rect x="230" y="300" width="70" height="26" rx="6" fill="#ff3a20"/>')
# o Blinder colado na porta do armário, cabeça inclinada escutando, mão subindo até a fresta
blinder(s, 1080, 1660, 1320, tilt=0.42, fill='#020203', rim='rimCold', reachR=0.5, reachL=0.12, blindfold='#d8d2c6')

# ===== porta do armário por dentro =====
top, gap, slat, n = 320, 40, 18, 8
x0, x1 = 170, 1750
holes = ''
for i in range(n):
    y = top + i * (gap + slat)
    holes += f' M {x0} {y} L {x1} {y} L {x1} {y+gap} L {x0} {y+gap} Z'
s(f'<path d="M 0 0 L {W} 0 L {W} {H} L 0 {H} Z{holes}" fill="url(#metal)" fill-rule="evenodd"/>')
s(f'<path d="M 0 0 L {W} 0 L {W} {H} L 0 {H} Z{holes}" filter="url(#scratch)" opacity="0.05" fill-rule="evenodd"/>')
for i in range(n):
    y = top + i * (gap + slat)
    # aba dobrada de cada lâmina (dá profundidade) + luz entrando pela borda
    s(f'<rect x="{x0}" y="{y+gap}" width="{x1-x0}" height="7" fill="#2c3238"/>')
    s(f'<rect x="{x0}" y="{y-3}" width="{x1-x0}" height="3" fill="#5a6c7c" opacity="0.6"/>')
    s(f'<rect x="{x0}" y="{y+gap+7}" width="{x1-x0}" height="{slat-7}" fill="#000" opacity="0.25"/>')
# moldura da área das frestas
s(f'<rect x="{x0-14}" y="{top-14}" width="{x1-x0+28}" height="{n*(gap+slat)+2}" fill="none" stroke="#050607" stroke-width="10" rx="6"/>')
# feixes de luz fria entrando
for i in range(n):
    y = top + i * (gap + slat) + gap / 2
# rebites e arranhões de unha
for x in (120, 1800):
    for y in (90, 990):
        s(f'<circle cx="{x}" cy="{y}" r="9" fill="#2a3036"/><circle cx="{x-2}" cy="{y-2}" r="4" fill="#4a535c"/>')
for k in range(5):
    bx = 1500 + k * 22
    s(f'<path d="M {bx} 820 q 6 70 -4 150" stroke="#55606a" stroke-width="3" fill="none" opacity="0.7"/>')
# bilhete colado
s('<g transform="rotate(5 1480 850)"><rect x="1330" y="770" width="300" height="170" fill="#d9cfb4"/><rect x="1330" y="770" width="300" height="170" fill="#000" opacity="0.18"/>'
  '<rect x="1440" y="755" width="80" height="30" fill="#bfb6a0" opacity="0.8" transform="rotate(-8 1480 770)"/>'
  '<text x="1480" y="845" text-anchor="middle" font-family="Marker" font-size="44" fill="#2a1010">NÃO RESPIRE</text>'
  '<text x="1480" y="900" text-anchor="middle" font-family="Marker" font-size="26" fill="#3a1a1a">ele escuta tudo</text></g>')
# bafo no frio
s('<ellipse cx="960" cy="1010" rx="460" ry="150" fill="url(#breath)"/>')
s('<ellipse cx="880" cy="960" rx="240" ry="80" fill="url(#breath)"/>')
# título e frase
title(s, 120, 250, 190)
tagline(s, 120, 990, 'PRENDA A RESPIRAÇÃO.', 46, red='RESPIRAÇÃO.')
finish(s)
s.save('thumb_locker.svg')
