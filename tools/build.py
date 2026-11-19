"""Bundle web/ into a single offline index.html and package it as a signed APK."""
import os, re, base64, sys, io
sys.path.insert(0, os.path.dirname(__file__))
from shell import make_dex
from apk import manifest, adaptive_icon, arsc, res_config, build_zip, sign_v2, verify_v2, load_or_make_key

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, 'web')
OUT = os.path.join(ROOT, 'build')


def inline_html():
    html = open(os.path.join(WEB, 'index.html'), encoding='utf-8').read()

    def css_inline(m):
        path = os.path.join(WEB, m.group(1))
        css = open(path, encoding='utf-8').read()
        def font(mm):
            fp = os.path.normpath(os.path.join(os.path.dirname(path), mm.group(1)))
            b64 = base64.b64encode(open(fp, 'rb').read()).decode()
            return f"url(data:font/woff;base64,{b64})"
        css = re.sub(r"url\(['\"]?([^'\")]+\.woff)['\"]?\)", font, css)
        return f"<style>\n{css}\n</style>"
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)"\s*/?>', css_inline, html)

    def js_inline(m):
        js = open(os.path.join(WEB, m.group(1)), encoding='utf-8').read()
        return f"<script>\n{js}\n</script>"
    html = re.sub(r'<script src="([^"]+)"></script>', js_inline, html)
    return html


def main(version_code=14, version_name='1.7.4'):
    os.makedirs(OUT, exist_ok=True)
    html = inline_html()
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
    icons = os.path.join(OUT, 'icons')
    R = 0x7f010000
    man = manifest('com.superbank.app', 'OneFI', version_code, version_name, 24, 34,
                   'com.superbank.app.MainActivity', R)
    res = arsc('com.superbank.app', 'mipmap', ['ic_launcher', 'ic_launcher_background', 'ic_launcher_foreground'], [
        (res_config(density=640), {0: 'res/mipmap-xxxhdpi-v4/ic_launcher.png',
                                   1: 'res/mipmap-xxxhdpi-v4/ic_launcher_background.png',
                                   2: 'res/mipmap-xxxhdpi-v4/ic_launcher_foreground.png'}),
        (res_config(density=0xFFFE, sdk=26), {0: 'res/mipmap-anydpi-v26/ic_launcher.xml'}),
    ])
    rd = lambda n: open(os.path.join(icons, n), 'rb').read()
    entries = [
        ('AndroidManifest.xml', man, True, 0),
        ('classes.dex', make_dex(), True, 0),
        ('resources.arsc', res, False, 4),
        ('res/mipmap-anydpi-v26/ic_launcher.xml', adaptive_icon(R + 1, R + 2), True, 0),
        ('res/mipmap-xxxhdpi-v4/ic_launcher.png', rd('ic_launcher.png'), False, 4),
        ('res/mipmap-xxxhdpi-v4/ic_launcher_background.png', rd('ic_launcher_background.png'), False, 4),
        ('res/mipmap-xxxhdpi-v4/ic_launcher_foreground.png', rd('ic_launcher_foreground.png'), False, 4),
        ('assets/index.html', html.encode('utf-8'), True, 0),
    ]
    z = build_zip(entries)
    key, cert = load_or_make_key(os.path.join(OUT, 'signing'))
    apk = sign_v2(z, key, cert)
    path = os.path.join(OUT, 'SuperBank.apk')
    open(path, 'wb').write(apk)
    print('APK', path, len(apk), 'bytes; v2 verify:', verify_v2(apk))


if __name__ == '__main__':
    main()
