# uso: pack.py in.rbxl srcdir out.rbxl  -> troca Source dos scripts pelos arquivos em srcdir
import sys,os,struct
sys.path.insert(0,os.path.dirname(__file__))
from rbxl import *
inp,srcdir,out=sys.argv[1:4]
hdr,chunks,classes,ic,props,parent=parse(open(inp,'rb').read())
def nm(r): return props.get(r,{}).get('Name',b'?').decode('utf8','replace')
def path(r):
    s=[]
    while r!=-1 and r in ic: s.append(nm(r)); r=parent.get(r,-1)
    return '/'.join(reversed(s))
ext={'Script':'server','LocalScript':'client','ModuleScript':'module'}
changed=0
for ch in chunks:
    name,b=ch
    if name!=b'PROP':continue
    cid,=struct.unpack('<I',b[:4]); l,=struct.unpack('<I',b[4:8]); pn=b[8:8+l].decode(); t=b[8+l]
    cname,refs=classes[cid]
    if pn!='Source' or cname not in ext: continue
    nb=bytearray(b[:9+l])
    for r in refs:
        fn=srcdir+'/'+path(r).replace(' ','_')+'.'+ext[cname]+'.lua'
        s=open(fn,'rb').read() if os.path.exists(fn) else props[r]['Source']
        if s!=props[r]['Source']: changed+=1; print('changed',path(r))
        nb+=struct.pack('<I',len(s))+s
    ch[1]=bytes(nb)
open(out,'wb').write(write(hdr,chunks))
print('ok',changed)
