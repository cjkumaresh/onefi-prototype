import struct,sys,zlib,hashlib
d=open(sys.argv[1],'rb').read()
def u32(o): return struct.unpack_from('<I',d,o)[0]
def u16(o): return struct.unpack_from('<H',d,o)[0]
def uleb(o):
    r=s=0
    while True:
        b=d[o];o+=1;r|=(b&0x7f)<<s;s+=7
        if b<0x80:return r,o
assert d[:8]==b'dex\n035\x00'
assert u32(8)==zlib.adler32(d[12:]) and d[12:32]==hashlib.sha1(d[32:]).digest() and u32(32)==len(d)
ns,so,nt,to,np,po,nf,fo,nm,mo,nc,co,ds,do=struct.unpack_from('<14I',d,0x38)
def S(i):
    o=u32(so+4*i); n,o=uleb(o); e=d.index(b'\0',o); return d[o:e].decode()
strs=[S(i) for i in range(ns)]; assert strs==sorted(strs)
T=[strs[u32(to+4*i)] for i in range(nt)]
def tl(o):
    if not o: return []
    return [T[u16(o+4+2*i)] for i in range(u32(o))]
P=[(strs[u32(po+12*i)],T[u32(po+12*i+4)],tl(u32(po+12*i+8))) for i in range(np)]
F=[(T[u16(fo+8*i)],T[u16(fo+8*i+2)],strs[u32(fo+8*i+4)]) for i in range(nf)]
M=[(T[u16(mo+8*i)],P[u16(mo+8*i+2)],strs[u32(mo+8*i+4)]) for i in range(nm)]
print('strings',ns,'types',nt,'protos',np,'fields',nf,'methods',nm)
for i,m in enumerate(M): print(' M',i,m[0],m[2],m[1][0],m[1][2],'->',m[1][1])
mo_=u32(0x34); n=u32(mo_)
print('map:',[(hex(u16(mo_+4+12*i)),u32(mo_+4+12*i+4),u32(mo_+4+12*i+8)) for i in range(n)])
for c in range(nc):
    b=co+32*c; cls,acc,sup,_,_,_,cdo,_=struct.unpack_from('<8I',d,b)
    print('class',T[cls],'extends',T[sup])
    o=cdo; sf,o=uleb(o); inf,o=uleb(o); dm,o=uleb(o); vm,o=uleb(o)
    idx=0
    for _ in range(inf): x,o=uleb(o); a,o=uleb(o); idx+=x; print('  field',F[idx])
    for cnt in (dm,vm):
        idx=0
        for _ in range(cnt):
            x,o=uleb(o); a,o=uleb(o); c_,o=uleb(o); idx+=x
            regs,ins,outs,tries,dbg,isz=struct.unpack_from('<HHHHII',d,c_)
            print('  method',M[idx][2],hex(a),'regs',regs,'ins',ins,'outs',outs,'insns',isz, 'off',c_)
