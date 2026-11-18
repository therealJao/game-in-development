import sys,os
sys.path.insert(0,os.path.dirname(__file__))
from rbxl import *
hdr,chunks,classes,ic,props,parent=parse(open(sys.argv[1],'rb').read())
out=sys.argv[2]
def nm(r): return props.get(r,{}).get('Name',b'?').decode('utf8','replace')
def path(r):
    s=[]
    while r!=-1 and r in ic: s.append(nm(r)); r=parent.get(r,-1)
    return '/'.join(reversed(s))
from collections import Counter
print(Counter(ic.values()).most_common(40))
os.makedirs(out,exist_ok=True)
with open(out+'/tree.txt','w') as f:
    for r in sorted(ic): f.write(f"{r}\t{ic[r]}\t{path(r)}\n")
for r,c in ic.items():
    if c in('Script','LocalScript','ModuleScript'):
        src=props[r].get('Source',b'')
        fn=out+'/src/'+path(r).replace(' ','_')+'.'+{'Script':'server','LocalScript':'client','ModuleScript':'module'}[c]+'.lua'
        os.makedirs(os.path.dirname(fn),exist_ok=True); open(fn,'wb').write(src)
