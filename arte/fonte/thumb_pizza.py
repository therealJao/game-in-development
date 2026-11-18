from lib import *
random.seed(77)
s = SVG()
def lg(id, c0, c1, vertical=True):
    s.d(f'<linearGradient id="{id}" x1="0" y1="0" x2="{0 if vertical else 1}" y2="{1 if vertical else 0}"><stop offset="0" stop-color="{c0}"/><stop offset="1" stop-color="{c1}"/></linearGradient>')
def rg(id, c, op):
    s.d(f'<radialGradient id="{id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{c}" stop-opacity="{op}"/><stop offset="1" stop-color="{c}" stop-opacity="0"/></radialGradient>')
lg('wall', '#14060e', '#0a0306')
lg('stageTop', '#3a2214', '#22140c')
lg('stageFront', '#2a170d', '#120a05')
lg('beamW', '#ffd9a0', '#ffd9a0')
s.d('<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2b0" stop-opacity="0.26"/><stop offset="1" stop-color="#ffb070" stop-opacity="0.03"/></linearGradient>')
s.d('<linearGradient id="beamR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5040" stop-opacity="0.34"/><stop offset="1" stop-color="#ff2010" stop-opacity="0.03"/></linearGradient>')
rg('pool', '#ffcf90', 0.35); rg('poolR', '#ff3020', 0.4); rg('eyeG', '#ffffff', 0.9); rg('eyeR', '#ff2a1a', 0.95)
s.d('<linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></linearGradient>')
rim_filter(s, 'rimR', '#ff3a26', radius=2, blur=5)

s(f'<rect width="{W}" height="{H}" fill="url(#wall)"/>')
# estrelas desbotadas no fundo do palco
for i in range(26):
    x, y, r = random.uniform(250, 1650), random.uniform(170, 520), random.uniform(10, 22)
    pts = [(x + math.cos(-math.pi/2 + k*math.pi/5) * (r if k % 2 == 0 else r*0.45), y + math.sin(-math.pi/2 + k*math.pi/5) * (r if k % 2 == 0 else r*0.45)) for k in range(10)]
    s.poly(pts, '#6a5420', f'opacity="{random.uniform(0.25,0.55):.2f}"')
# cortinas (dobras com sombra)
def curtain(xa, xb, hem, flip):
    n = 9
    w = (xb - xa) / n
    for i in range(n):
        x = xa + i * w
        sway = (i if flip else n - i) * 6
        s(f'<path d="M {x:.1f} 0 L {x+w:.1f} 0 L {x+w+sway*0.3:.1f} {hem + (i%2)*18} Q {x+w/2+sway*0.3:.1f} {hem+30+(i%3)*10} {x+sway*0.3:.1f} {hem + ((i+1)%2)*18} Z" fill="url(#fold{i%2})"/>')
s.d('<linearGradient id="fold0" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a0410"/><stop offset="0.5" stop-color="#4a0c26"/><stop offset="1" stop-color="#1a0410"/></linearGradient>')
s.d('<linearGradient id="fold1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#14030c"/><stop offset="0.55" stop-color="#3a0a1e"/><stop offset="1" stop-color="#100208"/></linearGradient>')
curtain(-40, 300, 700, False)
curtain(1620, 1960, 700, True)
# bambinela com festões em cima
for i in range(12):
    x = i * 170 - 40
    s(f'<path d="M {x} 0 L {x+170} 0 L {x+170} 70 Q {x+85} 150 {x} 70 Z" fill="url(#fold0)"/>')
    s(f'<path d="M {x} 70 Q {x+85} 150 {x+170} 70" fill="none" stroke="#8a6a24" stroke-width="6" opacity="0.7"/>')
# faixa "O SHOW NUNCA PARA"
s('<path d="M 560 170 Q 960 215 1360 170 L 1360 245 Q 960 290 560 245 Z" fill="#2a0c0c" stroke="#7a5a20" stroke-width="5"/>')
s('<path id="arc" d="M 600 228 Q 960 272 1320 228" fill="none"/>')
s('<text font-family="Creep" font-size="56" fill="#d8b860" letter-spacing="6"><textPath href="#arc" startOffset="50%" text-anchor="middle">O SHOW NUNCA PARA</textPath></text>')
# palco
s('<polygon points="180,700 1740,700 1800,760 120,760" fill="url(#stageTop)"/>')
s('<rect x="120" y="760" width="1680" height="90" fill="url(#stageFront)"/>')
for i in range(14): s(f'<line x1="{120+i*120}" y1="760" x2="{120+i*120}" y2="850" stroke="#0a0503" stroke-width="3"/>')
s('<rect x="120" y="756" width="1680" height="8" fill="#8a6a24" opacity="0.8"/>')
# chão quadriculado na frente do palco
VX, VY = 960, 560
for r in range(6):
    y0 = 850 + r * 40 + r * r * 6; y1 = 850 + (r+1) * 40 + (r+1) * (r+1) * 6
    for c in range(-12, 12):
        def X(cc, yy): return VX + cc * 160 * (yy - VY) / (850 - VY) * 0.55
        col = '#b8b0a2' if (r + c) % 2 == 0 else '#0e0b0c'
        s.poly([(X(c, y0), y0), (X(c+1, y0), y0), (X(c+1, y1), y1), (X(c, y1), y1)], col, 'opacity="0.3"')
s(f'<rect x="0" y="850" width="{W}" height="230" fill="url(#floorFade)"/>')

# feixes de holofote
for cx, g, pg in ((620, 'beam', 'pool'), (960, 'beamR', 'poolR'), (1300, 'beam', 'pool')):
    s(f'<polygon points="{cx-30},0 {cx+30},0 {cx+190},740 {cx-190},740" fill="url(#{g})"/>')
    s(f'<ellipse cx="{cx}" cy="735" rx="230" ry="38" fill="url(#{pg})"/>')

# ===== animatrônicos =====
def bot(cx, base, k, kind, fur, belly, eyeRed=False, prop=None):
    # k = escala; base = y do pé
    def P(x, y): return (cx + x * k, base - y * k)
    lg(f'f_{kind}', fur, '#050203'); lg(f'b_{kind}', belly, fur)
    F, B = f'url(#f_{kind})', f'url(#b_{kind})'
    # pernas
    for sx in (-1, 1):
        x, y = P(sx * 0.32 - 0.2, 1.4)
        s(f'<rect x="{x:.1f}" y="{y:.1f}" width="{0.4*k:.1f}" height="{1.4*k:.1f}" rx="{0.16*k:.1f}" fill="{F}"/>')
        x, y = P(sx * 0.36 - 0.28, 0.25)
        s(f'<rect x="{x:.1f}" y="{y:.1f}" width="{0.56*k:.1f}" height="{0.25*k:.1f}" rx="{0.1*k:.1f}" fill="{F}"/>')
    # tronco
    x, y = P(-0.75, 3.1)
    s(f'<rect x="{x:.1f}" y="{y:.1f}" width="{1.5*k:.1f}" height="{1.8*k:.1f}" rx="{0.55*k:.1f}" fill="{F}"/>')
    x, y = P(-0.5, 2.9)
    s(f'<rect x="{x:.1f}" y="{y:.1f}" width="{1.0*k:.1f}" height="{1.35*k:.1f}" rx="{0.45*k:.1f}" fill="{B}" opacity="0.9"/>')
    # braços caídos, um meio levantado
    for sx in (-1, 1):
        a = -14 if sx < 0 else (30 if prop else 10)
        x, y = P(sx * 0.85, 2.95)
        s(f'<rect x="{x - 0.2*k:.1f}" y="{y:.1f}" width="{0.4*k:.1f}" height="{1.5*k:.1f}" rx="{0.18*k:.1f}" fill="{F}" transform="rotate({a * sx} {x:.1f} {y:.1f})"/>')
    # cabeça um pouco caída
    hx, hy = P(0, 3.75)
    tilt = random.uniform(-14, 14)
    s(f'<g transform="rotate({tilt:.1f} {hx:.1f} {hy+0.5*k:.1f})">')
    if kind == 'bear':
        for sx in (-1, 1): s(f'<circle cx="{hx + sx*0.55*k:.1f}" cy="{hy - 0.55*k:.1f}" r="{0.25*k:.1f}" fill="{F}"/>')
    if kind == 'bunny':
        for sx, rot in ((-1, -8), (1, 28)):
            s(f'<ellipse cx="{hx + sx*0.3*k:.1f}" cy="{hy - 1.05*k:.1f}" rx="{0.17*k:.1f}" ry="{0.7*k:.1f}" fill="{F}" transform="rotate({rot} {hx + sx*0.3*k:.1f} {hy - 0.5*k:.1f})"/>')
    if kind == 'cat':
        for sx in (-1, 1): s(f'<path d="M {hx + sx*0.62*k:.1f} {hy - 0.15*k:.1f} L {hx + sx*0.55*k:.1f} {hy - 0.95*k:.1f} L {hx + sx*0.12*k:.1f} {hy - 0.5*k:.1f} Z" fill="{F}"/>')
    s(f'<ellipse cx="{hx:.1f}" cy="{hy:.1f}" rx="{0.72*k:.1f}" ry="{0.62*k:.1f}" fill="{F}"/>')
    # focinho / bico
    if True:
        s(f'<ellipse cx="{hx:.1f}" cy="{hy+0.22*k:.1f}" rx="{0.36*k:.1f}" ry="{0.24*k:.1f}" fill="{B}"/>')
        s(f'<ellipse cx="{hx:.1f}" cy="{hy+0.1*k:.1f}" rx="{0.09*k:.1f}" ry="{0.06*k:.1f}" fill="#0a0506"/>')
    # boca entreaberta com dentes
    s(f'<rect x="{hx-0.26*k:.1f}" y="{hy+0.36*k:.1f}" width="{0.52*k:.1f}" height="{0.12*k:.1f}" rx="{0.04*k:.1f}" fill="#050203"/>')
    for i in range(6): s(f'<rect x="{hx-0.24*k + i*0.085*k:.1f}" y="{hy+0.36*k:.1f}" width="{0.05*k:.1f}" height="{0.06*k:.1f}" fill="#d8ccb0"/>')
    # olhos: órbitas fundas e pupilas brilhando
    for sx in (-1, 1):
        ex, ey = hx + sx * 0.27 * k, hy - 0.12 * k
        s(f'<ellipse cx="{ex:.1f}" cy="{ey:.1f}" rx="{0.16*k:.1f}" ry="{0.14*k:.1f}" fill="#030102"/>')
        red = eyeRed and sx > 0
        s(f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="{0.16*k:.1f}" fill="url(#{"eyeR" if red else "eyeG"})"/>')
        s(f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="{0.035*k:.1f}" fill="{"#ff5040" if red else "#ffffff"}"/>')
    s('</g>')
    # adereços
    if prop == 'guitar':
        x, y = P(0.1, 2.1)
        s(f'<g transform="rotate(-35 {x:.1f} {y:.1f})"><ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{0.45*k:.1f}" ry="{0.32*k:.1f}" fill="#5a1414"/><rect x="{x+0.3*k:.1f}" y="{y-0.06*k:.1f}" width="{1.1*k:.1f}" height="{0.12*k:.1f}" fill="#2a1a10"/></g>')
    if prop == 'mic':
        x, y = P(1.15, 2.0)
        s(f'<rect x="{x:.1f}" y="{y:.1f}" width="{0.06*k:.1f}" height="{0.45*k:.1f}" fill="#222"/><circle cx="{x+0.03*k:.1f}" cy="{y:.1f}" r="{0.1*k:.1f}" fill="#555"/>')
    if prop == 'cupcake':
        x, y = P(1.1, 1.75)
        s(f'<path d="M {x-0.2*k:.1f} {y:.1f} L {x+0.2*k:.1f} {y:.1f} L {x+0.14*k:.1f} {y+0.25*k:.1f} L {x-0.14*k:.1f} {y+0.25*k:.1f} Z" fill="#6a4a8a"/><circle cx="{x:.1f}" cy="{y-0.05*k:.1f}" r="{0.2*k:.1f}" fill="#c87a9a"/><circle cx="{x:.1f}" cy="{y-0.28*k:.1f}" r="{0.05*k:.1f}" fill="#d02020"/>')

bot(620, 730, 100, 'bunny', '#9a8a8e', '#d8c8c4')
bot(960, 730, 106, 'bear', '#4e3220', '#8e6e4c', eyeRed=True)
bot(1300, 730, 100, 'cat', '#26242c', '#5a5660')

# o Blinder espiando por trás da cortina da direita
curtain(1700, 1960, 700, True)
s('<path d="M 1700 0 L 1700 700" stroke="#0a0206" stroke-width="12"/>')
# só a cabeça inclinada saindo de trás da cortina (pescoço comprido, torto)
s('<g transform="translate(1712 330) scale(1.7) translate(-1712 -330)">')
s('<g filter="url(#rimR)">')
s('<path d="M 1712 300 C 1690 290 1672 280 1660 262 L 1676 246 C 1690 262 1702 270 1712 276 Z" fill="#030102"/>')
s('<g transform="rotate(-58 1640 238)"><ellipse cx="1640" cy="238" rx="34" ry="44" fill="#030102"/></g>')
s('</g>')
s('<g transform="rotate(-58 1640 238)"><rect x="1604" y="222" width="72" height="14" fill="#d9d0c0"/><path d="M 1676 228 q 16 6 22 22" stroke="#d9d0c0" stroke-width="6" fill="none" stroke-linecap="round"/></g>')
# dedos compridos agarrando a borda da cortina
s('<g filter="url(#rimR)">')
s('<path d="M 1714 318 Q 1694 350 1700 392 L 1716 392 Z" fill="#030102"/>')
for i, (ln, dy) in enumerate(((50, 0), (62, 19), (57, 38), (42, 56))):
    y = 330 + dy
    s(f'<path d="M 1712 {y} Q {1712-ln*0.55:.0f} {y-14} {1712-ln:.0f} {y+2} Q {1712-ln-8:.0f} {y+10} {1712-ln-4:.0f} {y+26}" stroke="#030102" stroke-width="10" stroke-linecap="round" fill="none"/>')
    s(f'<circle cx="{1712-ln*0.55:.0f}" cy="{y-8}" r="6.5" fill="#030102"/>')
s('</g>')
s('</g>')

# mesas de festa no primeiro plano (silhuetas)
for tx in (180, 760, 1420):
    s(f'<rect x="{tx}" y="940" width="420" height="30" rx="8" fill="#050203"/>')
    s(f'<rect x="{tx+30}" y="965" width="20" height="120" fill="#050203"/><rect x="{tx+370}" y="965" width="20" height="120" fill="#050203"/>')
    for hx in (tx + 90, tx + 230, tx + 330):
        col = random.choice(['#7a1a24', '#1a3a6a', '#7a6a1a'])
        s(f'<path d="M {hx-22} 940 L {hx+22} 940 L {hx+4} 872 Z" fill="{col}" opacity="0.8"/><circle cx="{hx+4}" cy="870" r="7" fill="#d8ccb0" opacity="0.8"/>')
# balões murchos
for bx, by, col in ((330, 560, '#6a1018'), (1560, 600, '#16305a')):
    s(f'<path d="M {bx} {by+70} q 20 120 -10 250" stroke="#888" stroke-width="2" fill="none" opacity="0.6"/>')
    s(f'<ellipse cx="{bx}" cy="{by}" rx="48" ry="62" fill="{col}"/><ellipse cx="{bx-16}" cy="{by-22}" rx="10" ry="16" fill="#fff" opacity="0.25"/>')

s(f'<rect width="{W}" height="{H}" fill="#000" opacity="0.18"/>')
title(s, 70, 1040, 150)
tagline(s, 1860, 1040, 'A PIZZARIA FECHOU. ELE NÃO.', 38, anchor='end', red='ELE NÃO.')
finish(s)
s.save('thumb_pizza.svg')
