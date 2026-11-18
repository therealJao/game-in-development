# peças em comum das miniaturas do BLINDER (vetor feito à mão em código)
import math, random, base64
W, H = 1920, 1080
def b64(f): return base64.b64encode(open(f,'rb').read()).decode()
FONTS = {'Creep': b64('creepster.woff2'), 'Elite': b64('elite.woff2'), 'Marker': b64('marker.woff2')}

class SVG:
    def __init__(self, w=W, h=H):
        self.w, self.h = w, h
        self.o = []
        self.defs = []
    def __call__(self, s): self.o.append(s)
    def d(self, s): self.defs.append(s)
    def poly(self, pts, fill, extra=''):
        self('<polygon points="' + ' '.join(f'{a:.1f},{b:.1f}' for a, b in pts) + f'" fill="{fill}" {extra}/>')
    def save(self, fn):
        ff = ' '.join(f"@font-face{{font-family:{k};src:url(data:font/woff2;base64,{v});}}" for k, v in FONTS.items())
        head = f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}"><defs><style>{ff}</style>{COMMON_DEFS}' + ''.join(self.defs) + '</defs>'
        open(fn, 'w').write(head + '\n'.join(self.o) + '</svg>')

COMMON_DEFS = '''
<filter id="grit" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.15"/></filter>
<filter id="b2"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="b5" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<filter id="b60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
<filter id="titleGlow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="16" result="b"/><feFlood flood-color="#e01010" flood-opacity="0.85"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<linearGradient id="bone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6eddc"/><stop offset="0.55" stop-color="#ddcdb4"/><stop offset="1" stop-color="#a8957c"/></linearGradient>
<radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>
'''

def rim_filter(svg, fid, color, radius=3, blur=6, op=0.95):
    svg.d(f'<filter id="{fid}" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="{radius}" result="d"/><feGaussianBlur in="d" stdDeviation="{blur}" result="b"/><feFlood flood-color="{color}" flood-opacity="{op}"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')

def fog_filter(svg, fid, rgb, fx=0.004, fy=0.012, seed=21, alpha=-1.8, off=1.05):
    r, g, b = rgb
    svg.d(f'<filter id="{fid}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="{fx} {fy}" numOctaves="4" seed="{seed}"/><feColorMatrix type="matrix" values="0 0 0 0 {r}  0 0 0 0 {g}  0 0 0 0 {b}  0 0 0 {alpha} {off}"/></filter>')

def smooth(pts, closed=True):
    # Catmull-Rom -> Bézier (contornos orgânicos, sem cara de polígono)
    n = len(pts)
    d = f'M {pts[0][0]:.1f} {pts[0][1]:.1f} '
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = pts[(i - 1) % n] if closed or i > 0 else pts[0]
        p1 = pts[i]; p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if closed or i + 2 < n else pts[-1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f'C {c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f} '
    return d + ('Z' if closed else '')

# metade direita do corpo (u = x/altura, v = altura relativa a partir do pé)
BODY = [(0,1.0),(0.03,0.992),(0.045,0.968),(0.046,0.935),(0.037,0.905),(0.022,0.888),(0.019,0.874),
        (0.06,0.862),(0.105,0.852),(0.132,0.836),(0.148,0.8),(0.157,0.72),(0.162,0.62),(0.166,0.52),(0.171,0.43),(0.177,0.35),
        (0.186,0.315),(0.196,0.282),(0.193,0.25),(0.182,0.236),(0.171,0.262),(0.165,0.3),
        (0.152,0.37),(0.142,0.48),(0.132,0.6),(0.118,0.72),(0.103,0.765),
        (0.086,0.7),(0.077,0.6),(0.072,0.52),(0.076,0.47),(0.071,0.4),
        (0.069,0.3),(0.064,0.15),(0.06,0.035),(0.08,0.008),(0.074,0.0),(0.03,0.0),(0.032,0.1),(0.026,0.3),(0.016,0.44),(0.0,0.46)]

def _rot(p, c, a):
    dx, dy = p[0] - c[0], p[1] - c[1]
    return (c[0] + dx * math.cos(a) - dy * math.sin(a), c[1] + dx * math.sin(a) + dy * math.cos(a))

def blinder(svg, x, foot, h, tilt=0.35, fill='#020001', rim=None, reachR=0.0, reachL=0.0, fingers=True, blindfold='#d9d0c0', face=False):
    """Silhueta do Blinder. reachR/reachL = ângulo (rad) levantando o braço."""
    def S(u, v): return (x + u * h, foot - v * h)
    neck = S(0, 0.885)
    shR = S(0.12, 0.845); shL = S(-0.12, 0.845)
    def arm(p, side, ang):
        u, v = p
        if u > 0.1 and v < 0.858 and ang:
            return _rot(S(u * side, v), shR if side > 0 else shL, -ang * side)
        return S(u * side, v)
    right = [arm(p, 1, reachR) for p in BODY]
    left = [arm(p, -1, reachL) for p in reversed(BODY)]
    pts = right + left
    pts = [_rot(p, neck, tilt) if p[1] < neck[1] - 2 else p for p in pts]
    g = f' filter="url(#{rim})"' if rim else ''
    svg(f'<g{g}><path d="{smooth(pts)}" fill="{fill}"/>')
    if fingers:
        for side, ang in ((1, reachR), (-1, reachL)):
            hx, hy = arm((0.19, 0.245), side, ang)
            down = _rot((0, 1), (0, 0), -ang * side)
            for f in range(4):
                sp = (f - 1.5) * 0.012 * h
                ex = hx + down[0] * h * 0.075 + sp * (1 if abs(down[1]) > 0.5 else 0.3)
                ey = hy + down[1] * h * 0.075 + (sp if abs(down[1]) <= 0.5 else 0)
                mx = hx + down[0] * h * 0.04 + sp * 0.5; my = hy + down[1] * h * 0.04
                svg(f'<path d="M {hx:.1f} {hy:.1f} Q {mx + side * h * 0.008:.1f} {my:.1f} {ex:.1f} {ey:.1f}" stroke="{fill}" stroke-width="{h * 0.007:.1f}" stroke-linecap="round" fill="none"/>')
    svg('</g>')
    # venda nos olhos com pontas soltas
    if blindfold:
        a, b = _rot(S(-0.05, 0.952), neck, tilt), _rot(S(0.05, 0.952), neck, tilt)
        th = h * 0.022
        nx, ny = -(b[1] - a[1]), b[0] - a[0]; ln = math.hypot(nx, ny); nx, ny = nx / ln * th / 2, ny / ln * th / 2
        svg(f'<path d="M {a[0]-nx:.1f} {a[1]-ny:.1f} L {b[0]-nx:.1f} {b[1]-ny:.1f} L {b[0]+nx:.1f} {b[1]+ny:.1f} L {a[0]+nx:.1f} {a[1]+ny:.1f} Z" fill="{blindfold}"/>')
        t0 = _rot(S(-0.048, 0.955), neck, tilt)
        for k, (dx, dy) in enumerate(((-0.022, -0.03), (-0.008, -0.04))):
            e = _rot(S(-0.048 + dx, 0.955 + dy), neck, tilt)
            svg(f'<path d="M {t0[0]:.1f} {t0[1]:.1f} Q {(t0[0]+e[0])/2:.1f} {(t0[1]+e[1])/2 - h*0.01:.1f} {e[0]:.1f} {e[1]:.1f}" stroke="{blindfold}" stroke-width="{h*0.009:.1f}" stroke-linecap="round" fill="none" opacity="0.85"/>')
    if face:
        m0, m1 = _rot(S(-0.024, 0.915), neck, tilt), _rot(S(0.024, 0.915), neck, tilt)
        svg(f'<path d="M {m0[0]:.1f} {m0[1]:.1f} Q {(m0[0]+m1[0])/2:.1f} {(m0[1]+m1[1])/2 + h*0.014:.1f} {m1[0]:.1f} {m1[1]:.1f}" stroke="#e8e0d0" stroke-width="{h*0.004:.1f}" fill="none" opacity="0.8"/>')

def title(svg, x, y, size, anchor='start', spacing=8):
    svg(f'<g filter="url(#titleGlow)"><text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Creep" font-size="{size}" letter-spacing="{spacing}" fill="url(#bone)" stroke="#0a0002" stroke-width="{size/30:.1f}" paint-order="stroke">BLINDER</text></g>')

def tagline(svg, x, y, text, size=40, anchor='start', red=None):
    t = text if not red else text.replace(red, f'<tspan fill="#ff3a28">{red}</tspan>')
    svg(f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Elite" font-size="{size}" letter-spacing="{size*0.22:.0f}" fill="#e8dccb" stroke="#000" stroke-width="3" paint-order="stroke">{t}</text>')

def finish(svg, grit=0.13, vig=True):
    if vig: svg(f'<rect width="{svg.w}" height="{svg.h}" fill="url(#vig)"/>')
    svg(f'<rect width="{svg.w}" height="{svg.h}" filter="url(#grit)" opacity="{grit}"/>')
