import struct,sys
d=open(sys.argv[1],'rb').read()
u16=lambda o:struct.unpack_from('<H',d,o)[0]; u32=lambda o:struct.unpack_from('<I',d,o)[0]
ns,so,nt,to,np,po,nf,fo,nm,mo,nc,co=struct.unpack_from('<12I',d,0x38)
def uleb(o):
    r=s=0
    while True:
        b=d[o];o+=1;r|=(b&0x7f)<<s;s+=7
        if b<0x80:return r,o
def S(i):
    o=u32(so+4*i);_,o=uleb(o);return d[o:d.index(b'\0',o)].decode()
T=lambda i:S(u32(to+4*i))
M=lambda i:T(u16(mo+8*i)).split('/')[-1]+'->'+S(u32(mo+8*i+4))
F=lambda i:S(u32(fo+8*i+4))
N={0x6e:'invoke-virtual',0x6f:'invoke-super',0x70:'invoke-direct',0x71:'invoke-static',0x0a:'move-result',0x0c:'move-result-object',0x0e:'return-void',0x12:'const/4',0x13:'const/16',0x14:'const',0x1a:'const-string',0x22:'new-instance',0x1f:'check-cast',0x5b:'iput-object',0x54:'iget-object',0x38:'if-eqz',0x39:'if-nez',0x33:'if-ne',0x23:'new-array',0x4d:'aput-object',0x44:'aget',0x21:'array-length'}
want=sys.argv[2:]
for c in range(nc):
    cdo=u32(co+32*c+24); o=cdo; sf,o=uleb(o); inf,o=uleb(o); dm,o=uleb(o); vm,o=uleb(o)
    for _ in range(inf): _,o=uleb(o); _,o=uleb(o)
    for cnt in (dm,vm):
        idx=0
        for _ in range(cnt):
            x,o=uleb(o); a,o=uleb(o); off,o=uleb(o); idx+=x
            name=M(idx)
            if want and not any(w in name for w in want): continue
            regs,ins,outs,tries,dbg,n=struct.unpack_from('<HHHHII',d,off); p=off+16; i=0
            print('---',name,'regs',regs,'ins',ins,'outs',outs)
            while i<n:
                w=u16(p+2*i); op=w&0xff; nmn=N[op]
                if op in (0x6e,0x6f,0x70,0x71):
                    A=w>>12; b=u16(p+2*i+2); cc=u16(p+2*i+4); rs=[cc&15,(cc>>4)&15,(cc>>8)&15,(cc>>12)&15,(w>>8)&15][:A]; print(f'{i:3}',nmn,rs,M(b)); i+=3
                elif op in (0x0a,0x0c): print(f'{i:3}',nmn,'v%d'%(w>>8)); i+=1
                elif op==0x0e: print(f'{i:3}',nmn); i+=1
                elif op==0x12: v=(w>>12); v=v-16 if v>7 else v; print(f'{i:3}',nmn,'v%d'%((w>>8)&15),v); i+=1
                elif op==0x13: print(f'{i:3}',nmn,'v%d'%(w>>8),struct.unpack('<h',d[p+2*i+2:p+2*i+4])[0]); i+=2
                elif op==0x14: print(f'{i:3}',nmn,'v%d'%(w>>8),hex(u32(p+2*i+2))); i+=3
                elif op==0x1a: print(f'{i:3}',nmn,'v%d'%(w>>8),repr(S(u16(p+2*i+2)))); i+=2
                elif op==0x23: print(f'{i:3}',nmn,'v%d v%d'%((w>>8)&15,w>>12),T(u16(p+2*i+2))); i+=2
                elif op in (0x4d,0x44): x=u16(p+2*i+2); print(f'{i:3}',nmn,'v%d v%d v%d'%(w>>8,x&255,x>>8)); i+=2
                elif op==0x21: print(f'{i:3}',nmn,'v%d v%d'%((w>>8)&15,w>>12)); i+=1
                elif op in (0x22,0x1f): print(f'{i:3}',nmn,'v%d'%(w>>8),T(u16(p+2*i+2))); i+=2
                elif op in (0x5b,0x54): print(f'{i:3}',nmn,'v%d v%d'%((w>>8)&15,w>>12),F(u16(p+2*i+2))); i+=2
                elif op in (0x38,0x39): print(f'{i:3}',nmn,'v%d'%(w>>8),'->',i+struct.unpack('<h',d[p+2*i+2:p+2*i+4])[0]); i+=2
                elif op==0x33: print(f'{i:3}',nmn,'v%d v%d'%((w>>8)&15,w>>12),'->',i+struct.unpack('<h',d[p+2*i+2:p+2*i+4])[0]); i+=2
