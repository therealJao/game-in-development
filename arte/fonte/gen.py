import math, random, base64, sys
random.seed(7)
W=1024; CX, CY = 512, 455
L, R = 150, 874          # cantos do olho
TOPC, BOTC = 190, 735    # pontos de controle das pálpebras
font = base64.b64encode(open('creepster.woff2','rb').read()).decode()
with_text = sys.argv[1] == 'text'
eye_only = sys.argv[1] == 'eye'
out=[]
def P(s): out.append(s)

def qpt(t, ctrl):  # ponto na curva quadrática da pálpebra
    x=(1-t)**2*L+2*(1-t)*t*CX+t*t*R
    y=(1-t)**2*CY+2*(1-t)*t*ctrl+t*t*CY
    return x,y
def qtan(t, ctrl):
    dx=2*(1-t)*(CX-L)+2*t*(R-CX); dy=2*(1-t)*(ctrl-CY)+2*t*(CY-ctrl)
    n=math.hypot(dx,dy); return dx/n, dy/n

almond=f"M {L} {CY} Q {CX} {TOPC} {R} {CY} Q {CX} {BOTC} {L} {CY} Z"

P(f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{W}" viewBox="0 0 {W} {W}">
<defs>
<style>@font-face{{font-family:Creep;src:url(data:font/woff2;base64,{font}) format('woff2');}}</style>
<radialGradient id="bg" cx="50%" cy="44%" r="70%">
 <stop offset="0" stop-color="#5c0b10"/><stop offset="0.35" stop-color="#2a0407"/><stop offset="0.75" stop-color="#0b0103"/><stop offset="1" stop-color="#030001"/>
</radialGradient>
<radialGradient id="glow" cx="50%" cy="50%" r="50%">
 <stop offset="0" stop-color="#ff2a1a" stop-opacity="0.75"/><stop offset="0.5" stop-color="#b00010" stop-opacity="0.35"/><stop offset="1" stop-color="#600008" stop-opacity="0"/>
</radialGradient>
<radialGradient id="sclera" cx="{CX}" cy="{CY}" r="380" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#f3e4cc"/><stop offset="0.36" stop-color="#e0c4a4"/><stop offset="0.55" stop-color="#b47a66"/><stop offset="0.75" stop-color="#5e1a1a"/><stop offset="1" stop-color="#1e0406"/>
</radialGradient>
<radialGradient id="iris" cx="{CX}" cy="{CY}" r="152" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#fff2a0"/><stop offset="0.22" stop-color="#ffc23a"/><stop offset="0.45" stop-color="#ff5a0a"/><stop offset="0.72" stop-color="#d0000e"/><stop offset="0.92" stop-color="#5a0006"/><stop offset="1" stop-color="#200002"/>
</radialGradient>
<linearGradient id="lidShade" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#120203" stop-opacity="0.95"/><stop offset="0.22" stop-color="#2a0507" stop-opacity="0.55"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/>
 <stop offset="0.85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0204" stop-opacity="0.75"/>
</linearGradient>
<linearGradient id="blood" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#5a0006"/><stop offset="0.5" stop-color="#9c0010"/><stop offset="1" stop-color="#d0101c"/>
</linearGradient>
<linearGradient id="txt" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#ff4a3a"/><stop offset="0.5" stop-color="#d00818"/><stop offset="1" stop-color="#6a0008"/>
</linearGradient>
<clipPath id="eyeClip"><path d="{almond}"/></clipPath>
<filter id="grit" x="0" y="0" width="100%" height="100%">
 <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" seed="3" result="n"/>
 <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.15"/>
</filter>
<filter id="stain" x="0" y="0" width="100%" height="100%">
 <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="9"/>
 <feColorMatrix type="matrix" values="0 0 0 0 0.05  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.2"/>
</filter>
<filter id="soft"><feGaussianBlur stdDeviation="1.1"/></filter>
<filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="blur30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<filter id="wobble"><feTurbulence type="turbulence" baseFrequency="0.035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="9"/></filter>
<filter id="textGlow" x="-20%" y="-40%" width="140%" height="180%">
 <feGaussianBlur in="SourceAlpha" stdDeviation="14" result="b"/><feFlood flood-color="#ff1010" flood-opacity="0.85"/><feComposite in2="b" operator="in" result="g"/>
 <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
</defs>
''')
if not eye_only:
    P(f'<rect width="{W}" height="{W}" fill="url(#bg)"/><rect width="{W}" height="{W}" filter="url(#stain)" opacity="0.9"/>')

# rachaduras saindo do olho
def crack(x,y,ang,length,width,depth):
    pts=[(x,y)]
    for i in range(int(length/22)):
        ang+=random.uniform(-0.45,0.45)
        x+=math.cos(ang)*22; y+=math.sin(ang)*22
        pts.append((x,y))
    d="M "+" L ".join(f"{a:.1f} {b:.1f}" for a,b in pts)
    P(f'<path d="{d}" fill="none" stroke="#ff2a20" stroke-opacity="0.18" stroke-width="{width+5:.1f}" stroke-linecap="round" filter="url(#soft)"/>')
    P(f'<path d="{d}" fill="none" stroke="#050001" stroke-width="{width:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
    if depth>0:
        for _ in range(random.randint(1,2)):
            k=random.randint(1,len(pts)-1)
            crack(pts[k][0],pts[k][1],ang+random.choice([-1,1])*random.uniform(0.5,1.1),length*0.5,width*0.55,depth-1)
for i in range(0 if eye_only else 14):
    a=i/14*math.tau+random.uniform(-0.15,0.15)
    sx=CX+math.cos(a)*400; sy=CY+math.sin(a)*240
    crack(sx,sy,a,random.uniform(120,260),random.uniform(3,6),2)

# brilho vermelho atrás do olho
P(f'<ellipse cx="{CX}" cy="{CY}" rx="470" ry="300" fill="url(#glow)"/>')
# pele/pálpebra em volta (contorno grosso e enrugado)
P(f'<path d="{almond}" fill="#1c0406" stroke="#2b0609" stroke-width="70" stroke-linejoin="round" filter="url(#wobble)"/>')
P(f'<path d="{almond}" fill="none" stroke="#0d0102" stroke-width="30" stroke-linejoin="round"/>')
for k in range(1,4):  # rugas
    off=k*16
    P(f'<path d="M {L-10+k*8} {CY-6} Q {CX} {TOPC-off-10} {R+10-k*8} {CY-6}" fill="none" stroke="#3a0a0c" stroke-opacity="{0.6-k*0.12:.2f}" stroke-width="4" filter="url(#wobble)"/>')
    P(f'<path d="M {L-10+k*8} {CY+6} Q {CX} {BOTC+off+6} {R+10-k*8} {CY+6}" fill="none" stroke="#3a0a0c" stroke-opacity="{0.5-k*0.12:.2f}" stroke-width="4" filter="url(#wobble)"/>')

# ===== dentro do olho =====
P('<g clip-path="url(#eyeClip)">')
P(f'<rect x="0" y="0" width="{W}" height="{W}" fill="url(#sclera)"/>')
# veias
def vein(x,y,ang,length,width,depth):
    pts=[(x,y)]
    for i in range(int(length/10)):
        ang+=random.uniform(-0.5,0.5)
        x+=math.cos(ang)*10; y+=math.sin(ang)*10
        pts.append((x,y))
        if math.hypot(x-CX,y-CY)<150: break
    d="M "+" L ".join(f"{a:.1f} {b:.1f}" for a,b in pts)
    col=random.choice(["#a3000e","#b8101a","#8a0010","#c4202a"])
    P(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{width:.2f}" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" filter="url(#soft)"/>')
    if depth>0:
        for _ in range(random.randint(1,3)):
            k=random.randint(1,max(1,len(pts)-1))
            vein(pts[k][0],pts[k][1],ang+random.choice([-1,1])*random.uniform(0.4,1.0),length*0.55,width*0.6,depth-1)
for i in range(46):
    a=random.uniform(0,math.tau)
    sx=CX+math.cos(a)*390; sy=CY+math.sin(a)*190
    ang=math.atan2(CY-sy,CX-sx)+random.uniform(-0.35,0.35)
    vein(sx,sy,ang,random.uniform(110,240),random.uniform(2.6,5.2),2)
# sombra das pálpebras sobre o globo
P(f'<rect x="0" y="{TOPC+120}" width="{W}" height="{BOTC-TOPC-200}" fill="url(#lidShade)"/>')
# íris
P(f'<circle cx="{CX}" cy="{CY}" r="168" fill="#ff2010" opacity="0.35" filter="url(#blur8)"/>')
P(f'<circle cx="{CX}" cy="{CY}" r="152" fill="url(#iris)"/>')
for i in range(220):  # estrias
    a=random.uniform(0,math.tau)
    r0=random.uniform(28,70); r1=random.uniform(95,150)
    col=random.choice(["#fff0a0","#ffb030","#7a0008","#3a0004","#ff7a20"])
    op=random.uniform(0.15,0.55)
    w=random.uniform(0.8,2.6)
    P(f'<line x1="{CX+math.cos(a)*r0:.1f}" y1="{CY+math.sin(a)*r0:.1f}" x2="{CX+math.cos(a+random.uniform(-0.06,0.06))*r1:.1f}" y2="{CY+math.sin(a)*r1:.1f}" stroke="{col}" stroke-opacity="{op:.2f}" stroke-width="{w:.1f}"/>')
P(f'<circle cx="{CX}" cy="{CY}" r="150" fill="none" stroke="#140001" stroke-width="9"/>')
P(f'<circle cx="{CX}" cy="{CY}" r="62" fill="none" stroke="#ffe080" stroke-opacity="0.35" stroke-width="10" filter="url(#soft)"/>')
# pupila em fenda
P(f'<ellipse cx="{CX}" cy="{CY}" rx="30" ry="118" fill="#ff3010" opacity="0.5" filter="url(#blur8)"/>')
P(f'<path d="M {CX} {CY-122} C {CX+30} {CY-60} {CX+30} {CY+60} {CX} {CY+122} C {CX-30} {CY+60} {CX-30} {CY-60} {CX} {CY-122} Z" fill="#030000"/>')
# sombra superior da pálpebra cobrindo a íris
P(f'<path d="M 0 0 L {W} 0 L {W} {CY-60} Q {CX} {TOPC+60} 0 {CY-60} Z" fill="#0a0102" opacity="0.55" filter="url(#blur8)"/>')
# reflexos
P(f'<ellipse cx="{CX-62}" cy="{CY-70}" rx="34" ry="22" transform="rotate(-30 {CX-62} {CY-70})" fill="#ffffff" opacity="0.92"/>')
P(f'<ellipse cx="{CX+70}" cy="{CY+66}" rx="11" ry="7" fill="#ffffff" opacity="0.55"/>')
P(f'<path d="M {L+60} {CY-40} Q {CX} {TOPC+90} {R-60} {CY-40}" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="10" filter="url(#soft)"/>')
P('</g>')

# borda molhada da pálpebra
P(f'<path d="{almond}" fill="none" stroke="#5a0a10" stroke-width="7"/>')
P(f'<path d="M {L} {CY} Q {CX} {BOTC} {R} {CY}" fill="none" stroke="#c03040" stroke-opacity="0.45" stroke-width="3"/>')

# cílios irregulares na pálpebra de cima
for i in range(46):
    t=0.06+i/46*0.88+random.uniform(-0.006,0.006)
    x,y=qpt(t,TOPC)
    # ponto real na curva: a curva passa por y em CY.. ponto médio ~ (CY+TOPC)/2
    y=(1-t)**2*CY+2*(1-t)*t*TOPC+t*t*CY
    tx,ty=qtan(t,TOPC)
    nx,ny=ty,-tx
    if ny>0: nx,ny=-nx,-ny
    ln=random.uniform(26,62)*(0.55+math.sin(t*math.pi)*0.6)
    bend=random.uniform(-0.25,0.25)+(t-0.5)*1.1
    ex=x+(nx+tx*bend)*ln; ey=y+(ny+ty*bend)*ln
    mx=x+nx*ln*0.55; my=y+ny*ln*0.55
    P(f'<path d="M {x-tx*4:.1f} {y-ty*4:.1f} Q {mx:.1f} {my:.1f} {ex:.1f} {ey:.1f} Q {mx+tx*3:.1f} {my+ty*3:.1f} {x+tx*4:.1f} {y+ty*4:.1f} Z" fill="#070102"/>')
# cílios de baixo (menores)
for i in range(26):
    t=0.12+i/26*0.76
    y=(1-t)**2*CY+2*(1-t)*t*BOTC+t*t*CY
    x=(1-t)**2*L+2*(1-t)*t*CX+t*t*R
    tx,ty=qtan(t,BOTC); nx,ny=-ty,tx
    if ny<0: nx,ny=-nx,-ny
    ln=random.uniform(12,26)
    P(f'<path d="M {x-tx*3:.1f} {y-ty*3:.1f} L {x+nx*ln+tx*random.uniform(-6,6):.1f} {y+ny*ln:.1f} L {x+tx*3:.1f} {y+ty*3:.1f} Z" fill="#090103"/>')

# pontos de costura rasgados nos cantos (o olho foi costurado e se abriu)
def stitches(side):
    for k in range(3):
        t=(0.1+k*0.07) if side<0 else (0.9-k*0.07)
        xt=(1-t)**2*L+2*(1-t)*t*CX+t*t*R
        for ctrl,dy in ((TOPC,-1),(BOTC,1)):
            y=(1-t)**2*CY+2*(1-t)*t*ctrl+t*t*CY
            cx_, cy_ = xt, y+dy*30
            for (ax,ay,bx,by) in ((-13,-13,13,13),(-13,13,13,-13)):
                P(f'<line x1="{cx_+ax:.1f}" y1="{cy_+ay:.1f}" x2="{cx_+bx:.1f}" y2="{cy_+by:.1f}" stroke="#140c08" stroke-width="7" stroke-linecap="round"/>')
                P(f'<line x1="{cx_+ax:.1f}" y1="{cy_+ay:.1f}" x2="{cx_+bx:.1f}" y2="{cy_+by:.1f}" stroke="#7a5a44" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="5 4"/>')
            for (px,py) in ((-13,-13),(13,13),(-13,13),(13,-13)):
                P(f'<circle cx="{cx_+px:.1f}" cy="{cy_+py:.1f}" r="4" fill="#3a0306"/>')
        if k==0:
            # linha arrebentada pendurada
            y=(1-t)**2*CY+2*(1-t)*t*BOTC+t*t*CY+43
            P(f'<path d="M {xt+13*side:.1f} {y:.1f} q {side*10} 30 {side*2} 62" fill="none" stroke="#140c08" stroke-width="5" stroke-linecap="round"/>')
stitches(-1); stitches(1)

# lágrimas de sangue
def drip(t, length, w):
    x=(1-t)**2*L+2*(1-t)*t*CX+t*t*R
    y=(1-t)**2*CY+2*(1-t)*t*BOTC+t*t*CY - 4
    e=y+length
    P(f'<path d="M {x-w:.1f} {y:.1f} C {x-w*0.6:.1f} {y+length*0.4:.1f} {x-w*0.8:.1f} {e-w*1.6:.1f} {x-w*1.3:.1f} {e:.1f} A {w*1.3:.1f} {w*1.3:.1f} 0 1 0 {x+w*1.3:.1f} {e:.1f} C {x+w*0.8:.1f} {e-w*1.6:.1f} {x+w*0.6:.1f} {y+length*0.4:.1f} {x+w:.1f} {y:.1f} Z" fill="url(#blood)"/>')
    P(f'<path d="M {x-w*0.35:.1f} {y+10:.1f} L {x-w*0.4:.1f} {e-6:.1f}" stroke="#ff8080" stroke-opacity="0.35" stroke-width="{max(1.5,w*0.25):.1f}" stroke-linecap="round"/>')
short = with_text or eye_only
drip(0.38, 150 if not short else 110, 11)
drip(0.52, 250 if not short else 160, 15)
drip(0.6, 90, 8)
drip(0.71, 180 if not short else 120, 10)

if with_text:
    for i in range(9):
        x=CX-330+i*82+random.uniform(-20,20); w=random.uniform(4,8)
        ln=random.uniform(18,50)
        P(f'<path d="M {x-w:.1f} 952 C {x-w:.1f} {952+ln*0.6:.1f} {x-w*1.3:.1f} {952+ln:.1f} {x:.1f} {952+ln+w:.1f} C {x+w*1.3:.1f} {952+ln:.1f} {x+w:.1f} {952+ln*0.6:.1f} {x+w:.1f} 952 Z" fill="#8a0010"/>')
    P(f'<g filter="url(#textGlow)"><text x="{CX}" y="958" text-anchor="middle" font-family="Creep" font-size="232" letter-spacing="6" fill="url(#txt)" stroke="#120002" stroke-width="7" paint-order="stroke">BLINDER</text></g>')

# grão e vinheta final
if not eye_only: P(f'<rect width="{W}" height="{W}" filter="url(#grit)" opacity="0.16"/>')
if not eye_only: P(f'<rect width="{W}" height="{W}" fill="none" stroke="#000" stroke-width="60" opacity="0.6" filter="url(#blur30)"/>')
P('</svg>')
open(sys.argv[2],'w').write('\n'.join(out))
