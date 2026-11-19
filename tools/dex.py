"""Minimal DEX (035) assembler — enough to emit a small WebView shell without the Android SDK."""
import struct, hashlib, zlib

NO_INDEX = 0xFFFFFFFF

def uleb(n):
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)

def mutf8(s):
    out = bytearray()
    for ch in s:
        c = ord(ch)
        if c == 0:
            out += b'\xc0\x80'
        elif c < 0x80:
            out.append(c)
        elif c < 0x800:
            out += bytes([0xC0 | (c >> 6), 0x80 | (c & 0x3F)])
        else:
            out += bytes([0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)])
    return bytes(out)

SHORTY = lambda t: t if len(t) == 1 else 'L'

# instruction sizes in 16-bit code units
SIZES = {'invoke-virtual': 3, 'invoke-super': 3, 'invoke-direct': 3, 'invoke-static': 3,
         'move-result': 1, 'move-result-object': 1, 'return-void': 1, 'const/4': 1,
         'const/16': 2, 'const': 3, 'const-string': 2, 'new-instance': 2,
         'iput-object': 2, 'iget-object': 2, 'check-cast': 2, 'new-array': 2, 'aput-object': 2, 'aget': 2, 'array-length': 1, 'if-lez': 2, 'if-eqz': 2, 'if-nez': 2, 'if-ne': 2, 'if-eq': 2,
         'label': 0}
OPC = {'invoke-virtual': 0x6e, 'invoke-super': 0x6f, 'invoke-direct': 0x70, 'invoke-static': 0x71,
       'move-result': 0x0a, 'move-result-object': 0x0c, 'return-void': 0x0e, 'const/4': 0x12,
       'const/16': 0x13, 'const': 0x14, 'const-string': 0x1a, 'new-instance': 0x22,
       'iput-object': 0x5b, 'iget-object': 0x54, 'check-cast': 0x1f, 'new-array': 0x23, 'aput-object': 0x4d, 'aget': 0x44, 'array-length': 0x21, 'if-lez': 0x3d, 'if-eqz': 0x38, 'if-nez': 0x39, 'if-ne': 0x33, 'if-eq': 0x32}


class Method:
    def __init__(self, cls, name, ret, params, access, regs, code):
        self.cls, self.name, self.ret, self.params = cls, name, ret, tuple(params)
        self.access, self.regs, self.code = access, regs, code
        self.ins = len(self.params) + (0 if access & 0x8 else 1)


class ClassDef:
    def __init__(self, name, sup, access=0x1):
        self.name, self.sup, self.access = name, sup, access
        self.fields = []   # (name, type, access)
        self.interfaces = []
        self.methods = []


def build(classes):
    strings, types, protos, fields, methods = set(), set(), set(), set(), set()

    def add_type(t):
        types.add(t); strings.add(t)

    def add_proto(ret, params):
        add_type(ret)
        for p in params: add_type(p)
        shorty = SHORTY(ret) + ''.join(SHORTY(p) for p in params)
        strings.add(shorty)
        protos.add((ret, tuple(params)))

    def add_method(ref):
        c, n, r, ps = ref
        add_type(c); strings.add(n); add_proto(r, ps); methods.add((c, n, r, tuple(ps)))

    def add_field(ref):
        c, n, t = ref
        add_type(c); strings.add(n); add_type(t); fields.add(ref)

    for cd in classes:
        add_type(cd.name); add_type(cd.sup)
        for itf in cd.interfaces: add_type(itf)
        for (n, t, a) in cd.fields: add_field((cd.name, n, t))
        for m in cd.methods:
            add_method((m.cls, m.name, m.ret, m.params))
            for ins in m.code:
                op = ins[0]
                if op.startswith('invoke'): add_method(ins[2])
                elif op == 'const-string': strings.add(ins[2])
                elif op in ('new-instance', 'check-cast'): add_type(ins[2])
                elif op == 'new-array': add_type(ins[3])
                elif op in ('iput-object', 'iget-object'): add_field(ins[3])

    S = sorted(strings)
    sidx = {s: i for i, s in enumerate(S)}
    T = sorted(types, key=lambda t: sidx[t])
    tidx = {t: i for i, t in enumerate(T)}
    P = sorted(protos, key=lambda p: (tidx[p[0]], tuple(tidx[x] for x in p[1])))
    pidx = {p: i for i, p in enumerate(P)}
    F = sorted(fields, key=lambda f: (tidx[f[0]], sidx[f[1]], tidx[f[2]]))
    fidx = {f: i for i, f in enumerate(F)}
    M = sorted(methods, key=lambda m: (tidx[m[0]], sidx[m[1]], pidx[(m[2], m[3])]))
    midx = {m: i for i, m in enumerate(M)}

    def mref(ref):
        c, n, r, ps = ref
        return midx[(c, n, r, tuple(ps))]

    def assemble(m):
        # pass 1: label positions
        pos, labels = 0, {}
        for ins in m.code:
            if ins[0] == 'label': labels[ins[1]] = pos
            pos += SIZES[ins[0]]
        out = []
        pos = 0
        outs = 0
        for ins in m.code:
            op = ins[0]
            if op == 'label':
                continue
            o = OPC[op]
            if op.startswith('invoke'):
                regs = ins[1]
                assert len(regs) <= 5
                outs = max(outs, len(regs))
                r = list(regs) + [0] * (5 - len(regs))
                C, D, E, F_, G = r
                out += [(len(regs) << 12) | (G << 8) | o, mref(ins[2]), (F_ << 12) | (E << 8) | (D << 4) | C]
            elif op in ('move-result', 'move-result-object'):
                out += [(ins[1] << 8) | o]
            elif op == 'return-void':
                out += [o]
            elif op == 'const/4':
                v = ins[2]; assert -8 <= v <= 7 and ins[1] < 16
                out += [((v & 0xF) << 12) | (ins[1] << 8) | o]
            elif op == 'const/16':
                v = ins[2]; assert -32768 <= v <= 32767
                out += [(ins[1] << 8) | o, v & 0xFFFF]
            elif op == 'const':
                v = ins[2] & 0xFFFFFFFF
                out += [(ins[1] << 8) | o, v & 0xFFFF, v >> 16]
            elif op == 'const-string':
                out += [(ins[1] << 8) | o, sidx[ins[2]]]
            elif op in ('new-instance', 'check-cast'):
                out += [(ins[1] << 8) | o, tidx[ins[2]]]
            elif op in ('iput-object', 'iget-object'):
                A, B = ins[1], ins[2]; assert A < 16 and B < 16
                out += [(B << 12) | (A << 8) | o, fidx[ins[3]]]
            elif op == 'new-array':
                A, B = ins[1], ins[2]; assert A < 16 and B < 16
                out += [(B << 12) | (A << 8) | o, tidx[ins[3]]]
            elif op in ('aput-object', 'aget'):
                out += [(ins[1] << 8) | o, (ins[3] << 8) | ins[2]]
            elif op == 'array-length':
                A, B = ins[1], ins[2]; assert A < 16 and B < 16
                out += [(B << 12) | (A << 8) | o]
            elif op in ('if-eqz', 'if-nez', 'if-lez'):
                off = labels[ins[2]] - pos
                out += [(ins[1] << 8) | o, off & 0xFFFF]
            elif op in ('if-ne', 'if-eq'):
                A, B = ins[1], ins[2]; assert A < 16 and B < 16
                off = labels[ins[3]] - pos
                out += [(B << 12) | (A << 8) | o, off & 0xFFFF]
            pos += SIZES[op]
            assert len(out) == pos, (op, len(out), pos)
        return out, outs

    # ---- layout ----
    HDR = 0x70
    off = HDR
    string_ids_off = off; off += 4 * len(S)
    type_ids_off = off; off += 4 * len(T)
    proto_ids_off = off; off += 12 * len(P)
    field_ids_off = off; off += 8 * len(F)
    method_ids_off = off; off += 8 * len(M)
    class_defs_off = off; off += 32 * len(classes)
    data_off = off

    data = bytearray()
    def align4():
        while (data_off + len(data)) % 4: data.append(0)
    def cur(): return data_off + len(data)

    # code items
    align4()
    code_start = cur()
    code_offs = {}
    allm = [m for cd in classes for m in cd.methods]
    for m in allm:
        align4()
        insns, outs = assemble(m)
        code_offs[id(m)] = cur()
        data += struct.pack('<HHHHII', m.regs, m.ins, outs, 0, 0, len(insns))
        data += b''.join(struct.pack('<H', u) for u in insns)
    n_code = len(allm)

    # type lists (proto params)
    align4()
    tl_start = cur()
    tl_offs = {}
    for p in P:
        ps = p[1]
        if not ps or ps in tl_offs: continue
        align4()
        tl_offs[ps] = cur()
        data += struct.pack('<I', len(ps)) + b''.join(struct.pack('<H', tidx[x]) for x in ps)
    for cd in classes:
        ps = tuple(cd.interfaces)
        if not ps or ps in tl_offs: continue
        align4()
        tl_offs[ps] = cur()
        data += struct.pack('<I', len(ps)) + b''.join(struct.pack('<H', tidx[x]) for x in ps)
    n_tl = len(tl_offs)

    # string data
    sd_start = cur()
    sd_offs = []
    for s in S:
        sd_offs.append(cur())
        data += uleb(len(s.encode('utf-16-le')) // 2) + mutf8(s) + b'\x00'

    # class data
    cdata_start = cur()
    cdata_offs = []
    for cd in classes:
        cdata_offs.append(cur())
        flds = sorted(((fidx[(cd.name, n, t)], a) for (n, t, a) in cd.fields))
        direct = sorted([m for m in cd.methods if (m.access & 0x10008) or m.name == '<init>' or (m.access & 0x2)], key=lambda m: mref((m.cls, m.name, m.ret, m.params)))
        virt = sorted([m for m in cd.methods if m not in direct], key=lambda m: mref((m.cls, m.name, m.ret, m.params)))
        data += uleb(0) + uleb(len(flds)) + uleb(len(direct)) + uleb(len(virt))
        prev = 0
        for (fi, a) in flds:
            data += uleb(fi - prev) + uleb(a); prev = fi
        for group in (direct, virt):
            prev = 0
            for m in group:
                mi = mref((m.cls, m.name, m.ret, m.params))
                data += uleb(mi - prev) + uleb(m.access) + uleb(code_offs[id(m)]); prev = mi

    # map list
    align4()
    map_off = cur()
    entries = [(0x0000, 1, 0), (0x0001, len(S), string_ids_off), (0x0002, len(T), type_ids_off),
               (0x0003, len(P), proto_ids_off)]
    if F: entries.append((0x0004, len(F), field_ids_off))
    entries += [(0x0005, len(M), method_ids_off), (0x0006, len(classes), class_defs_off),
                (0x2001, n_code, code_start)]
    if n_tl: entries.append((0x1001, n_tl, tl_start))
    entries += [(0x2002, len(S), sd_start), (0x2000, len(classes), cdata_start), (0x1000, 1, map_off)]
    entries.sort(key=lambda e: e[2])
    data += struct.pack('<I', len(entries))
    for (t, n, o) in entries:
        data += struct.pack('<HHII', t, 0, n, o)

    # ---- id sections ----
    ids = bytearray()
    for o in sd_offs: ids += struct.pack('<I', o)
    for t in T: ids += struct.pack('<I', sidx[t])
    for p in P:
        ret, ps = p
        shorty = SHORTY(ret) + ''.join(SHORTY(x) for x in ps)
        ids += struct.pack('<III', sidx[shorty], tidx[ret], tl_offs.get(ps, 0) if ps else 0)
    for f in F: ids += struct.pack('<HHI', tidx[f[0]], tidx[f[2]], sidx[f[1]])
    for m in M: ids += struct.pack('<HHI', tidx[m[0]], pidx[(m[2], m[3])], sidx[m[1]])
    for i, cd in enumerate(classes):
        ids += struct.pack('<IIIIIIII', tidx[cd.name], cd.access, tidx[cd.sup], tl_offs[tuple(cd.interfaces)] if cd.interfaces else 0, NO_INDEX, 0, cdata_offs[i], 0)
    assert HDR + len(ids) == data_off

    file_size = data_off + len(data)
    hdr = bytearray(b'dex\n035\x00')
    hdr += b'\x00' * 4 + b'\x00' * 20
    hdr += struct.pack('<IIIIII', file_size, HDR, 0x12345678, 0, 0, map_off)
    hdr += struct.pack('<II', len(S), string_ids_off)
    hdr += struct.pack('<II', len(T), type_ids_off)
    hdr += struct.pack('<II', len(P), proto_ids_off)
    hdr += struct.pack('<II', len(F), field_ids_off if F else 0)
    hdr += struct.pack('<II', len(M), method_ids_off)
    hdr += struct.pack('<II', len(classes), class_defs_off)
    hdr += struct.pack('<II', len(data), data_off)
    assert len(hdr) == HDR
    dex = bytearray(hdr + ids + data)
    dex[12:32] = hashlib.sha1(bytes(dex[32:])).digest()
    dex[8:12] = struct.pack('<I', zlib.adler32(bytes(dex[12:])) & 0xFFFFFFFF)
    return bytes(dex)
