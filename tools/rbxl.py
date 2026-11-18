import struct, lz4.block, zstandard
def read_chunks(data):
    assert data[:8]==b'<roblox!'
    hdr=data[:32]; pos=32; chunks=[]
    while pos<len(data):
        name=data[pos:pos+4]; clen,ulen,res=struct.unpack('<III',data[pos+4:pos+16]); pos+=16
        if clen==0: body=data[pos:pos+ulen]; pos+=ulen
        else:
            raw=data[pos:pos+clen]; pos+=clen
            body=zstandard.ZstdDecompressor().decompress(raw,max_output_size=ulen) if raw[:4]==b'\x28\xb5\x2f\xfd' else lz4.block.decompress(raw,uncompressed_size=ulen)
        chunks.append([name,body])
        if name==b'END\0': break
    return hdr,chunks
def write(hdr,chunks):
    out=bytearray(hdr)
    for name,body in chunks:
        if name==b'END\0': out+=name+struct.pack('<III',0,len(body),0)+body
        else:
            c=lz4.block.compress(bytes(body),store_size=False)
            out+=name+struct.pack('<III',len(c),len(body),0)+c
    return bytes(out)
def untransform_i32(b,n):
    r=[]
    for i in range(n):
        v=(b[i]<<24)|(b[n+i]<<16)|(b[2*n+i]<<8)|b[3*n+i]
        v=(v>>1)^(-(v&1)); r.append(v)
    return r
def parse(data):
    hdr,chunks=read_chunks(data)
    classes={}; inst_class={}; props={}; parent={}
    for name,b in chunks:
        if name==b'INST':
            cid,=struct.unpack('<I',b[:4]); l,=struct.unpack('<I',b[4:8]); cname=b[8:8+l].decode(); p=8+l+1
            n,=struct.unpack('<I',b[p:p+4]); p+=4
            ids=untransform_i32(b[p:],n); acc=0; refs=[]
            for d in ids: acc+=d; refs.append(acc)
            classes[cid]=(cname,refs)
            for r in refs: inst_class[r]=cname
        elif name==b'PRNT':
            n,=struct.unpack('<I',b[1:5]); a=untransform_i32(b[5:],n); c=untransform_i32(b[5+4*n:],n)
            acc=0;ch=[]
            for d in a: acc+=d; ch.append(acc)
            acc=0;pa=[]
            for d in c: acc+=d; pa.append(acc)
            parent=dict(zip(ch,pa))
    for name,b in chunks:
        if name==b'PROP':
            cid,=struct.unpack('<I',b[:4]); l,=struct.unpack('<I',b[4:8]); pn=b[8:8+l].decode(); t=b[8+l]; p=9+l
            if t==1:
                refs=classes[cid][1]
                for r in refs:
                    sl,=struct.unpack('<I',b[p:p+4]); s=b[p+4:p+4+sl]; p+=4+sl
                    props.setdefault(r,{})[pn]=s
    return hdr,chunks,classes,inst_class,props,parent
