import math, random, base64
random.seed(13)
W,H=1920,1080
VX,VY=1400,520     # ponto de fuga
K=560
creep=base64.b64encode(open('creepster.woff2','rb').read()).decode()
elite=base64.b64encode(open('elite.woff2','rb').read()).decode()
o=[]
def P(x): o.append(x)
def pr(x,y,z): return (VX+x*K/z, VY-y*K/z)
def poly(pts, fill, extra=''):
    P('<polygon points="'+' '.join(f'{a:.1f},{b:.1f}' for a,b in pts)+f'" fill="{fill}" {extra}/>')
def shade(c, f):
    r,g,b=int(c[1:3],16),int(c[3:5],16),int(c[5:7],16)
    return '#%02x%02x%02x'%(int(r*f),int(g*f),int(b*f))
LAMPZ=2.0
def light(z, x=0, y=0):
    # luz: lâmpada no teto em z=LAMPZ + queda com a profundidade
    d=math.hypot((z-LAMPZ)*1.2, x*0.8, (y-1.1)*0.6)
    return min(1.0, 0.18+0.95/(1+d*d*2.2)) * (1.25/(z**0.6))

P(f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
<style>@font-face{{font-family:Creep;src:url(data:font/woff2;base64,{creep});}} @font-face{{font-family:Elite;src:url(data:font/woff2;base64,{elite});}}</style>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a0103"/><stop offset="0.5" stop-color="#16040a"/><stop offset="1" stop-color="#0c0204"/></linearGradient>
<radialGradient id="cone" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#ffd59a" stop-opacity="0.45"/><stop offset="0.6" stop-color="#ffb070" stop-opacity="0.08"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>
<radialGradient id="redfog" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d0101a" stop-opacity="0.55"/><stop offset="1" stop-color="#600008" stop-opacity="0"/></radialGradient>
<linearGradient id="leftDark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050001" stop-opacity="1"/><stop offset="0.42" stop-color="#050001" stop-opacity="0.92"/><stop offset="0.6" stop-color="#050001" stop-opacity="0.2"/><stop offset="1" stop-color="#050001" stop-opacity="0"/></linearGradient>
<linearGradient id="txt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5040"/><stop offset="0.5" stop-color="#d00818"/><stop offset="1" stop-color="#5a0006"/></linearGradient>
<radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>
<filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="blur12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="blur40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
<filter id="grit" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.15"/></filter>
<filter id="fog" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.012" numOctaves="4" seed="21"/><feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.08  0 0 0 0 0.1  0 0 0 -1.8 1.05"/></filter>
<filter id="textGlow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="18" result="b"/><feFlood flood-color="#ff1010" flood-opacity="0.9"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="rim" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d"/><feGaussianBlur in="d" stdDeviation="6" result="b"/><feFlood flood-color="#ff2010" flood-opacity="0.9"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>
''')

ZN, ZF = 0.9, 4.2
# parede do fundo
fx0,fy0=pr(-1,1.15,ZF); fx1,fy1=pr(1,-1,ZF)
l=light(ZF)
poly([(fx0,fy0),(fx1,fy0),(fx1,fy1),(fx0,fy1)], shade('#3a1418',l))
# porta entreaberta no fundo com luz vermelha
dx0,dy0=pr(-0.35,0.55,ZF); dx1,dy1=pr(0.35,-1,ZF)
poly([(dx0,dy0),(dx1,dy0),(dx1,dy1),(dx0,dy1)],'#050001')
P(f'<rect x="{dx0+8:.1f}" y="{dy0:.1f}" width="{(dx1-dx0)*0.22:.1f}" height="{dy1-dy0:.1f}" fill="#ff2a1a" opacity="0.55" filter="url(#blur4)"/>')
P(f'<ellipse cx="{VX}" cy="{(dy0+dy1)/2:.1f}" rx="170" ry="150" fill="url(#redfog)"/>')

# chão quadriculado (pizzaria)
zs=[ZN]
while zs[-1]<ZF: zs.append(zs[-1]+0.32)
zs[-1]=ZF
for i in range(len(zs)-1):
    z0,z1=zs[i],zs[i+1]
    for j in range(8):
        u0=-1+j*0.25; u1=u0+0.25
        base='#d8cfc0' if (i+j)%2==0 else '#141012'
        l=light((z0+z1)/2,(u0+u1)/2,-1)
        poly([pr(u0,-1,z0),pr(u1,-1,z0),pr(u1,-1,z1),pr(u0,-1,z1)], shade(base,min(1,l*0.75)))
# teto
for i in range(len(zs)-1):
    z0,z1=zs[i],zs[i+1]
    poly([pr(-1,1.15,z0),pr(1,1.15,z0),pr(1,1.15,z1),pr(-1,1.15,z1)], shade('#2a2224',light((z0+z1)/2,0,1.15)*0.7))
# paredes laterais com armários
for side in (-1,1):
    poly([pr(side,1.15,ZN),pr(side,1.15,ZF),pr(side,-1,ZF),pr(side,-1,ZN)], shade('#3a1a20',0.5))
    z=ZN+0.05
    n=0
    while z<ZF-0.25:
        w=0.3
        l=light(z+w/2,side,0)
        col=random.choice(['#4a5a56','#5a2a2a','#2e4058'])
        a,b,c,d=pr(side,0.75,z),pr(side,0.75,z+w),pr(side,-1,z+w),pr(side,-1,z)
        poly([a,b,c,d],shade(col,l*0.9))
        poly([a,b,c,d],'none',f'stroke="{shade("#000000",1)}" stroke-width="{max(1,3/z):.1f}"')
        # frestas
        for k in range(5):
            yy=0.55-k*0.06
            p0,p1=pr(side,yy,z+0.06),pr(side,yy,z+w-0.06)
            P(f'<line x1="{p0[0]:.1f}" y1="{p0[1]:.1f}" x2="{p1[0]:.1f}" y2="{p1[1]:.1f}" stroke="#050505" stroke-width="{max(1,4/z):.1f}"/>')
        # puxador
        hp=pr(side,-0.1,z+w-0.05)
        P(f'<rect x="{hp[0]-2:.1f}" y="{hp[1]-14/z:.1f}" width="{max(2,5/z):.1f}" height="{28/z:.1f}" fill="#9a9a9a" opacity="{l:.2f}"/>')
        # um armário entreaberto com mão saindo
        if n==2 and side==1:
            dd=pr(side-0.12,0.75,z+0.02); de=pr(side-0.12,-1,z+0.02)
            poly([a,dd,de,d],'#050203')
            for f in range(4):
                fx,fy=pr(side-0.05,0.05+f*0.035,z+0.04)
                P(f'<path d="M {fx:.1f} {fy:.1f} q {-26/z:.1f} {4/z:.1f} {-40/z:.1f} {16/z:.1f}" stroke="#c9a68c" stroke-width="{9/z:.1f}" stroke-linecap="round" fill="none"/>')
        z+=w+0.02; n+=1
    # sangue escorrendo na parede
    for _ in range(3):
        zz=random.uniform(1.2,3.4); yy=random.uniform(0.2,0.9)
        p0=pr(side,yy,zz); p1=pr(side,yy-random.uniform(0.3,0.8),zz)
        P(f'<line x1="{p0[0]:.1f}" y1="{p0[1]:.1f}" x2="{p1[0]:.1f}" y2="{p1[1]:.1f}" stroke="#7a0008" stroke-width="{10/zz:.1f}" stroke-linecap="round" opacity="0.85"/>')
# poças e manchas de sangue arrastadas no chão
for i in range(16):
    z=ZN+0.25+i*0.17; x=math.sin(i*0.9)*0.12+0.12
    cxp,cyp=pr(x,-1,z); rx=random.uniform(28,60)/z; ry=rx*0.28
    P(f'<ellipse cx="{cxp:.1f}" cy="{cyp:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="#5a0006" opacity="{0.85-i*0.03:.2f}" filter="url(#blur4)"/>')
# lâmpada e cone de luz
lx,ly=pr(0,1.15,LAMPZ)
P(f'<line x1="{lx}" y1="{ly}" x2="{lx}" y2="{ly+40}" stroke="#111" stroke-width="3"/>')
P(f'<ellipse cx="{lx}" cy="{ly+48}" rx="26" ry="9" fill="#1a1414"/><circle cx="{lx}" cy="{ly+56}" r="9" fill="#ffe0a8"/>')
P(f'<circle cx="{lx}" cy="{ly+56}" r="40" fill="#ffc070" opacity="0.5" filter="url(#blur12)"/>')
c0=pr(-0.75,-1,LAMPZ-0.4); c1=pr(0.75,-1,LAMPZ-0.4)
P(f'<polygon points="{lx-14},{ly+58} {lx+14},{ly+58} {c1[0]:.1f},{c1[1]:.1f} {c0[0]:.1f},{c0[1]:.1f}" fill="url(#cone)"/>')

# silhueta do Blinder no fim do corredor
SZ=3.3
fb=pr(0,-1,SZ); hd=pr(0,1.02,SZ)
h=fb[1]-hd[1]
x0=fb[0]
def S(u,v): return (x0+u*h, fb[1]-v*h)
body=[(0,1.0),(0.035,0.985),(0.05,0.95),(0.045,0.91),(0.03,0.895),  # cabeça
      (0.09,0.86),(0.13,0.84),(0.15,0.8),(0.17,0.62),(0.18,0.45),(0.2,0.33),(0.215,0.24),(0.2,0.235),(0.19,0.3),(0.165,0.42),(0.14,0.6),(0.11,0.72),
      (0.08,0.6),(0.075,0.45),(0.085,0.25),(0.09,0.0),(0.06,0.0),(0.045,0.25),(0.025,0.45),(0,0.5)]
right=[S(u,v) for u,v in body]
left=[S(-u*(1.06 if v<0.8 else 1),v-(0.05 if 0.2<v<0.45 and u>0.17 else 0)) for u,v in reversed(body)]
# cabeça inclinada: gira os pontos da cabeça
pts=right+left
cx,cy=S(0,0.92)
def rot(p,a):
    dx,dy=p[0]-cx,p[1]-cy
    return (cx+dx*math.cos(a)-dy*math.sin(a), cy+dx*math.sin(a)+dy*math.cos(a))
pts=[rot(p,0.35) if p[1]<S(0,0.89)[1] else p for p in pts]
P('<g filter="url(#rim)">')
poly(pts,'#020001')
# dedos compridos
for side in (-1,1):
    hx,hy=S(side*0.208,0.235)
    for f in range(4):
        P(f'<path d="M {hx:.1f} {hy:.1f} q {side*f*1.5:.1f} {h*0.03:.1f} {side*(f-1.5)*2.5:.1f} {h*0.07:.1f}" stroke="#020001" stroke-width="{h*0.008:.1f}" stroke-linecap="round" fill="none"/>')
P('</g>')
# venda nos olhos e boca rasgada
b0=rot(S(-0.04,0.955),0.35); b1=rot(S(0.04,0.955),0.35)
P(f'<line x1="{b0[0]:.1f}" y1="{b0[1]:.1f}" x2="{b1[0]:.1f}" y2="{b1[1]:.1f}" stroke="#d8d0c0" stroke-width="{h*0.018:.1f}" opacity="0.8"/>')
m0=rot(S(-0.022,0.918),0.35); m1=rot(S(0.022,0.918),0.35)
P(f'<path d="M {m0[0]:.1f} {m0[1]:.1f} Q {(m0[0]+m1[0])/2:.1f} {(m0[1]+m1[1])/2+h*0.012:.1f} {m1[0]:.1f} {m1[1]:.1f}" stroke="#ff2a1a" stroke-width="{h*0.006:.1f}" fill="none"/>')
P(f'<ellipse cx="{fb[0]}" cy="{fb[1]+4}" rx="{h*0.25:.1f}" ry="{h*0.03:.1f}" fill="#000" opacity="0.7" filter="url(#blur4)"/>')

# névoa e escuridão
P(f'<rect width="{W}" height="{H}" filter="url(#fog)" opacity="0.55"/>')
P(f'<rect width="{W}" height="{H}" fill="url(#leftDark)"/>')

# olho gigante observando (canto esquerdo)
P(f'<circle cx="560" cy="330" r="380" fill="#b00010" opacity="0.28" filter="url(#blur40)"/>')
P('<image href="eye.svg" x="40" y="-200" width="1040" height="1040" opacity="0.96"/>')

# título
for i in range(8):
    x=560-320+i*90+random.uniform(-20,20); w=random.uniform(4,9); ln=random.uniform(20,60)
    if i == 5: continue
    P(f'<path d="M {x-w:.1f} 872 C {x-w:.1f} {872+ln*0.6:.1f} {x-w*1.3:.1f} {872+ln:.1f} {x:.1f} {872+ln+w:.1f} C {x+w*1.3:.1f} {872+ln:.1f} {x+w:.1f} {872+ln*0.6:.1f} {x+w:.1f} 872 Z" fill="#8a0010"/>')
P(f'<g filter="url(#textGlow)"><text x="560" y="880" text-anchor="middle" font-family="Creep" font-size="250" letter-spacing="8" fill="url(#txt)" stroke="#120002" stroke-width="8" paint-order="stroke">BLINDER</text></g>')
P('<text x="560" y="1000" text-anchor="middle" font-family="Elite" font-size="44" letter-spacing="10" fill="#e8dccb">ELE NÃO VÊ.  ELE <tspan fill="#ff3020">ESCUTA.</tspan></text>')

P(f'<rect width="{W}" height="{H}" fill="url(#vig)"/>')
P(f'<rect width="{W}" height="{H}" filter="url(#grit)" opacity="0.14"/>')
P('</svg>')
open('banner.svg','w').write('\n'.join(o))
