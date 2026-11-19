"""Assemble a signed APK without the Android SDK: binary XML, resources.arsc, aligned zip, v2 signature."""
import struct, zlib, hashlib, os, sys, datetime

# ------------------------------------------------------------------ binary XML
ANDROID_NS = 'http://schemas.android.com/apk/res/android'
ATTR_IDS = {
    'theme': 0x01010000, 'label': 0x01010001, 'icon': 0x01010002, 'name': 0x01010003,
    'exported': 0x01010010, 'launchMode': 0x0101001d, 'screenOrientation': 0x0101001e,
    'configChanges': 0x0101001f, 'drawable': 0x01010199, 'minSdkVersion': 0x0101020c,
    'versionCode': 0x0101021b, 'versionName': 0x0101021c, 'windowSoftInputMode': 0x0101022b,
    'targetSdkVersion': 0x01010270, 'allowBackup': 0x01010280, 'hardwareAccelerated': 0x010102d3,
}
T_REF, T_STR, T_DEC, T_HEX, T_BOOL = 0x01, 0x03, 0x10, 0x11, 0x12


def string_pool(strings, utf8=False):
    # UTF-16 pool
    offs, body = [], bytearray()
    for s in strings:
        offs.append(len(body))
        u = s.encode('utf-16-le')
        body += struct.pack('<H', len(u) // 2) + u + b'\x00\x00'
    while len(body) % 4: body.append(0)
    hdr_size = 28
    strings_start = hdr_size + 4 * len(strings)
    size = strings_start + len(body)
    return struct.pack('<HHIIIIII', 0x0001, hdr_size, size, len(strings), 0, 0, strings_start, 0) + \
        b''.join(struct.pack('<I', o) for o in offs) + bytes(body)


def axml(root):
    """root = (tag, [(ns_or_None, name, type, value)], [children]). Android attrs use ns='android'."""
    attr_names = []   # with resource ids, ordered by id
    def walk(n):
        tag, attrs, kids = n
        for (ns, name, t, v) in attrs:
            if ns == 'android' and name not in attr_names: attr_names.append(name)
        for k in kids: walk(k)
    walk(root)
    attr_names.sort(key=lambda a: ATTR_IDS[a])
    pool = list(attr_names)
    def add(s):
        if s not in pool: pool.append(s)
        return pool.index(s)
    add('android'); add(ANDROID_NS)
    def collect(n):
        tag, attrs, kids = n
        add(tag)
        for (ns, name, t, v) in attrs:
            if ns != 'android': add(name)
            if t == T_STR: add(v)
        for k in kids: collect(k)
    collect(root)
    idx = lambda s: pool.index(s)

    chunks = bytearray()
    resmap = struct.pack('<HHI', 0x0180, 8, 8 + 4 * len(attr_names)) + b''.join(struct.pack('<I', ATTR_IDS[a]) for a in attr_names)
    chunks += resmap
    chunks += struct.pack('<HHIIIII', 0x0100, 16, 24, 1, 0xFFFFFFFF, idx('android'), idx(ANDROID_NS))
    line = [1]
    def emit(n):
        tag, attrs, kids = n
        line[0] += 1
        def key(a):
            ns, name, t, v = a
            return (0, ATTR_IDS[name]) if ns == 'android' else (1, idx(name))
        attrs = sorted(attrs, key=key)
        body = bytearray()
        for (ns, name, t, v) in attrs:
            nsi = idx(ANDROID_NS) if ns == 'android' else 0xFFFFFFFF
            if t == T_STR:
                raw, data = idx(v), idx(v)
            elif t == T_BOOL:
                raw, data = 0xFFFFFFFF, 0xFFFFFFFF if v else 0
            else:
                raw, data = 0xFFFFFFFF, v & 0xFFFFFFFF
            body += struct.pack('<IIIHBBI', nsi, idx(name), raw, 8, 0, t, data)
        ext = struct.pack('<IIHHHHHH', 0xFFFFFFFF, idx(tag), 20, 20, len(attrs), 0, 0, 0)
        el = struct.pack('<HHIII', 0x0102, 16, 16 + len(ext) + len(body), line[0], 0xFFFFFFFF) + ext + body
        chunks.extend(el)
        for k in kids: emit(k)
        line[0] += 1
        chunks.extend(struct.pack('<HHIIIII', 0x0103, 16, 24, line[0], 0xFFFFFFFF, 0xFFFFFFFF, idx(tag)))
    emit(root)
    chunks += struct.pack('<HHIIIII', 0x0101, 16, 24, line[0] + 1, 0xFFFFFFFF, idx('android'), idx(ANDROID_NS))
    sp = string_pool(pool)
    body = sp + chunks
    return struct.pack('<HHI', 0x0003, 8, 8 + len(body)) + body


def manifest(pkg, label, version_code, version_name, min_sdk, target_sdk, activity, icon_ref):
    A = 'android'
    return axml(('manifest', [(A, 'versionCode', T_DEC, version_code), (A, 'versionName', T_STR, version_name),
                              (None, 'package', T_STR, pkg)], [
        ('uses-sdk', [(A, 'minSdkVersion', T_DEC, min_sdk), (A, 'targetSdkVersion', T_DEC, target_sdk)], []),
        ('uses-permission', [(A, 'name', T_STR, 'android.permission.VIBRATE')], []),
        ('uses-permission', [(A, 'name', T_STR, 'android.permission.RECORD_AUDIO')], []),
        ('queries', [], [('intent', [], [('action', [(A, 'name', T_STR, 'android.speech.action.RECOGNIZE_SPEECH')], [])]),
                         ('intent', [], [('action', [(A, 'name', T_STR, 'android.speech.RecognitionService')], [])])]),
        ('application', [(A, 'label', T_STR, label), (A, 'icon', T_REF, icon_ref),
                         (A, 'allowBackup', T_BOOL, False), (A, 'hardwareAccelerated', T_BOOL, True)], [
            ('activity', [(A, 'name', T_STR, activity), (A, 'exported', T_BOOL, True),
                          (A, 'launchMode', T_DEC, 2), (A, 'screenOrientation', T_DEC, 1),
                          (A, 'configChanges', T_HEX, 0x0FB0), (A, 'windowSoftInputMode', T_HEX, 0x12)], [
                ('intent-filter', [], [
                    ('action', [(A, 'name', T_STR, 'android.intent.action.MAIN')], []),
                    ('category', [(A, 'name', T_STR, 'android.intent.category.LAUNCHER')], []),
                ])
            ])
        ])
    ]))


def adaptive_icon(bg_ref, fg_ref):
    A = 'android'
    return axml(('adaptive-icon', [], [
        ('background', [(A, 'drawable', T_REF, bg_ref)], []),
        ('foreground', [(A, 'drawable', T_REF, fg_ref)], []),
    ]))

# ------------------------------------------------------------------ resources.arsc

def res_config(density=0, sdk=0):
    c = bytearray(64)
    struct.pack_into('<I', c, 0, 64)
    struct.pack_into('<H', c, 14, density)      # screenType: orientation(12) touchscreen(13) density(14)
    struct.pack_into('<H', c, 24, sdk)          # version: sdkVersion(24) minorVersion(26)
    return bytes(c)


def arsc(pkg, type_name, keys, configs):
    """configs: list of (config_bytes, {key_index: global_string})."""
    gstrings = []
    for _, ent in configs:
        for v in ent.values():
            if v not in gstrings: gstrings.append(v)
    gpool = string_pool(gstrings)
    tpool = string_pool([type_name])
    kpool = string_pool(keys)
    n = len(keys)
    spec_flags = [0] * n
    for cfg, ent in configs:
        for k in ent: spec_flags[k] |= 0x0500
    spec = struct.pack('<HHIBBHI', 0x0202, 16, 16 + 4 * n, 1, 0, 0, n) + b''.join(struct.pack('<I', f) for f in spec_flags)
    types = b''
    for cfg, ent in configs:
        hdr_size = 20 + len(cfg)
        offsets, entries = [], bytearray()
        for k in range(n):
            if k in ent:
                offsets.append(len(entries))
                entries += struct.pack('<HHI', 8, 0, k) + struct.pack('<HBBI', 8, 0, T_STR, gstrings.index(ent[k]))
            else:
                offsets.append(0xFFFFFFFF)
        entries_start = hdr_size + 4 * n
        size = entries_start + len(entries)
        types += struct.pack('<HHIBBHII', 0x0201, hdr_size, size, 1, 0, 0, n, entries_start) + cfg + \
            b''.join(struct.pack('<I', o) for o in offsets) + bytes(entries)
    name = pkg.encode('utf-16-le')[:254]
    name = name + b'\x00' * (256 - len(name))
    PH = 288
    type_strings_off = PH
    key_strings_off = PH + len(tpool)
    body = tpool + kpool + spec + types
    pkg_chunk = struct.pack('<HHII', 0x0200, PH, PH + len(body), 0x7f) + name + \
        struct.pack('<IIIII', type_strings_off, 1, key_strings_off, n, 0) + body
    assert len(pkg_chunk) == PH + len(body)
    total = 12 + len(gpool) + len(pkg_chunk)
    return struct.pack('<HHII', 0x0002, 12, total, 1) + gpool + pkg_chunk

# ------------------------------------------------------------------ zip

def build_zip(entries):
    """entries: list of (name, data, compress:bool, align:int). Returns bytes."""
    out = bytearray()
    central = bytearray()
    dos_time, dos_date = 0, (2026 - 1980) << 9 | (11 << 5) | 18
    for (name, data, compress, align) in entries:
        nb = name.encode()
        crc = zlib.crc32(data) & 0xFFFFFFFF
        if compress:
            co = zlib.compressobj(9, zlib.DEFLATED, -15)
            payload = co.compress(data) + co.flush(); method = 8
        else:
            payload = data; method = 0
        offset = len(out)
        extra = b''
        if align and not compress:
            data_start = offset + 30 + len(nb)
            pad = (-data_start) % align
            extra = b'\x00' * pad
        out += struct.pack('<IHHHHHIIIHH', 0x04034b50, 20 if compress else 10, 0, method, dos_time, dos_date,
                           crc, len(payload), len(data), len(nb), len(extra)) + nb + extra + payload
        central += struct.pack('<IHHHHHHIIIHHHHHII', 0x02014b50, 20, 20 if compress else 10, 0, method, dos_time,
                               dos_date, crc, len(payload), len(data), len(nb), 0, 0, 0, 0, 0, offset) + nb
    cd_off = len(out)
    out += central
    out += struct.pack('<IHHHHIIH', 0x06054b50, 0, 0, len(entries), len(entries), len(central), cd_off, 0)
    return bytes(out)

# ------------------------------------------------------------------ v2 signing

def lp(b): return struct.pack('<I', len(b)) + b


def chunk_digest(sections):
    digs = []
    for sec in sections:
        for i in range(0, len(sec), 1 << 20):
            c = sec[i:i + (1 << 20)]
            digs.append(hashlib.sha256(b'\xa5' + struct.pack('<I', len(c)) + c).digest())
    return hashlib.sha256(b'\x5a' + struct.pack('<I', len(digs)) + b''.join(digs)).digest()


def find_eocd(z):
    i = z.rfind(b'PK\x05\x06')
    cd_size, cd_off = struct.unpack_from('<II', z, i + 12)
    return i, cd_off, cd_size


def sign_v2(z, key, cert_der):
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    eocd_i, cd_off, cd_size = find_eocd(z)
    s1, s2, s3 = z[:cd_off], z[cd_off:cd_off + cd_size], z[eocd_i:]
    digest = chunk_digest([s1, s2, s3])
    ALG = 0x0103
    digests = lp(lp(struct.pack('<I', ALG) + lp(digest)))
    certs = lp(lp(cert_der))
    signed_data = digests + certs + lp(b'')
    sig = key.sign(signed_data, padding.PKCS1v15(), hashes.SHA256())
    pub = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    signer = lp(signed_data) + lp(lp(struct.pack('<I', ALG) + lp(sig))) + lp(pub)
    v2_value = lp(lp(signer))
    pair = struct.pack('<Q', 4 + len(v2_value)) + struct.pack('<I', 0x7109871a) + v2_value
    block_size = len(pair) + 8 + 16
    block = struct.pack('<Q', block_size) + pair + struct.pack('<Q', block_size) + b'APK Sig Block 42'
    new_eocd = bytearray(s3)
    struct.pack_into('<I', new_eocd, 16, cd_off + len(block))
    return s1 + block + s2 + bytes(new_eocd)


def verify_v2(apk):
    """Independent-ish check: parse the block back, recompute digest, verify RSA signature."""
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography import x509
    eocd_i, cd_off, cd_size = find_eocd(apk)
    assert apk[cd_off - 16:cd_off] == b'APK Sig Block 42'
    size = struct.unpack_from('<Q', apk, cd_off - 24)[0]
    start = cd_off - size - 8
    assert struct.unpack_from('<Q', apk, start)[0] == size
    o = start + 8
    found = None
    while o < cd_off - 24:
        ln = struct.unpack_from('<Q', apk, o)[0]; pid = struct.unpack_from('<I', apk, o + 8)[0]
        if pid == 0x7109871a: found = apk[o + 12:o + 8 + ln]
        o += 8 + ln
    assert found
    rd = lambda b, i: (b[i + 4:i + 4 + struct.unpack_from('<I', b, i)[0]], i + 4 + struct.unpack_from('<I', b, i)[0])
    signers, _ = rd(found, 0)
    signer, _ = rd(signers, 0)
    sd, i = rd(signer, 0)
    sigs, i = rd(signer, i)
    pub, i = rd(signer, i)
    s0, _ = rd(sigs, 0)
    alg = struct.unpack_from('<I', s0, 0)[0]; sig, _ = rd(s0, 4)
    key = serialization.load_der_public_key(pub)
    key.verify(sig, sd, padding.PKCS1v15(), hashes.SHA256())
    dg, j = rd(sd, 0); certs, j = rd(sd, j)
    d0, _ = rd(dg, 0); dig, _ = rd(d0, 4)
    c0, _ = rd(certs, 0)
    cert = x509.load_der_x509_certificate(c0)
    assert cert.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo) == pub
    eocd = bytearray(apk[eocd_i:]); struct.pack_into('<I', eocd, 16, start)
    assert chunk_digest([apk[:start], apk[cd_off:eocd_i], bytes(eocd)]) == dig
    return alg, cert.subject.rfc4514_string()


def load_or_make_key(path):
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization, hashes
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    if os.path.exists(path + '.key'):
        key = serialization.load_pem_private_key(open(path + '.key', 'rb').read(), None)
        cert = open(path + '.crt', 'rb').read()
        return key, cert
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'Super Bank Prototype'),
                      x509.NameAttribute(NameOID.ORGANIZATION_NAME, 'Super Bank')])
    now = datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
            .serial_number(x509.random_serial_number()).not_valid_before(now)
            .not_valid_after(now + datetime.timedelta(days=365 * 30)).sign(key, hashes.SHA256()))
    der = cert.public_bytes(serialization.Encoding.DER)
    open(path + '.key', 'wb').write(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    open(path + '.crt', 'wb').write(der)
    return key, der
