import struct, sys, zipfile
def pool(d, o):
    t,hs,sz,n,sn,fl,ss,st=struct.unpack_from('<HHIIIIII',d,o); assert t==1
    offs=struct.unpack_from(f'<{n}I',d,o+hs); out=[]
    for x in offs:
        p=o+ss+x; L=struct.unpack_from('<H',d,p)[0]; out.append(d[p+2:p+2+2*L].decode('utf-16-le'))
    return out, sz
def dump(d):
    t,hs,size=struct.unpack_from('<HHI',d,0); assert t==3 and size==len(d), (t,size,len(d))
    o=8; S=None; ids=[]; depth=0; out=[]
    while o<len(d):
        ct,chs,csz=struct.unpack_from('<HHI',d,o)
        if ct==1: S,_=pool(d,o)
        elif ct==0x180: ids=list(struct.unpack_from(f'<{(csz-8)//4}I',d,o+8))
        elif ct==0x102:
            ns,name,ast,asz,ac=struct.unpack_from('<IIHHH',d,o+16)
            attrs=[]
            for i in range(ac):
                a=o+16+ast+i*asz; ans,an,raw,vs,r0,dt,data=struct.unpack_from('<IIIHBBI',d,a)
                rid=hex(ids[an]) if an<len(ids) else '-'
                v=S[data] if dt==3 else hex(data) if dt in (1,0x11) else bool(data) if dt==0x12 else data
                attrs.append(f'{S[an]}({rid})={v}')
            out.append('  '*depth+'<'+S[name]+' '+' '.join(attrs)+'>'); depth+=1
        elif ct==0x103: depth-=1
        o+=csz
    assert o==len(d)
    return '\n'.join(out)
z=zipfile.ZipFile(sys.argv[1])
print(dump(z.read('AndroidManifest.xml')))
print(dump(z.read('res/mipmap-anydpi-v26/ic_launcher.xml')))
# arsc
d=z.read('resources.arsc'); t,hs,sz,pc=struct.unpack_from('<HHII',d,0); assert t==2 and sz==len(d)
g,gs=pool(d,12); print('global strings',g)
po=12+gs; pt,phs,psz,pid=struct.unpack_from('<HHII',d,po); assert pt==0x200 and po+psz==len(d)
name=d[po+12:po+12+256].decode('utf-16-le').rstrip('\0'); ts,lt,ks,lk,tio=struct.unpack_from('<IIIII',d,po+268)
types,_=pool(d,po+ts); keys,_=pool(d,po+ks); print('pkg',hex(pid),name,types,keys)
o=po+phs
while o<po+psz:
    ct,chs,csz=struct.unpack_from('<HHI',d,o)
    if ct==0x201:
        tid,fl,_,ec,es=struct.unpack_from('<BBHII',d,o+8); cfg=d[o+20:o+chs]; dens,=struct.unpack_from('<H',cfg,14); sdk,=struct.unpack_from('<H',cfg,24)
        offs=struct.unpack_from(f'<{ec}I',d,o+chs)
        for k,off in enumerate(offs):
            if off==0xFFFFFFFF: continue
            e=o+es+off; esz,efl,key=struct.unpack_from('<HHI',d,e); vs,r0,dt,data=struct.unpack_from('<HBBI',d,e+esz)
            print(f'  0x7f{tid:02x}{k:04x} {keys[key]} density={dens} sdk={sdk} -> {g[data]}')
    o+=csz
