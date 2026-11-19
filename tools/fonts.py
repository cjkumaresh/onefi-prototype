import sys
from fontTools import subset
from fontTools.ttLib import TTFont
C='/mnt/skills/examples/canvas-design/canvas-fonts/'
I='/usr/share/fonts/opentype/inter/'
D='/usr/share/fonts/truetype/google-fonts/ofl/dmsans/'
jobs={
 'InstrumentSerif-Regular':C+'InstrumentSerif-Regular.ttf',
 'InstrumentSerif-Italic':C+'InstrumentSerif-Italic.ttf',
 'InstrumentSans-Regular':C+'InstrumentSans-Regular.ttf',
 'InstrumentSans-Bold':C+'InstrumentSans-Bold.ttf',
 'Inter-Regular':I+'Inter-Regular.otf','Inter-Medium':I+'Inter-Medium.otf','Inter-SemiBold':I+'Inter-SemiBold.otf',
 'InterDisplay-SemiBold':I+'InterDisplay-SemiBold.otf','InterDisplay-Bold':I+'InterDisplay-Bold.otf',
 'DMSans':D+'DMSans[opsz,wght].ttf',
 'Outfit-Regular':C+'Outfit-Regular.ttf','Outfit-Bold':C+'Outfit-Bold.ttf',
 'GeistMono-Regular':C+'GeistMono-Regular.ttf',
}
uni='U+0020-007E,U+00A0-00FF,U+2009,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2190-2193,U+2212,U+20AC,U+2122,U+2713'
for name,src in jobs.items():
    opts=subset.Options(); opts.flavor='woff'; opts.layout_features=['kern','liga','tnum','lnum','ss01','cv11','calt']
    opts.name_IDs=['*']; opts.notdef_outline=True
    f=TTFont(src); s=subset.Subsetter(opts); s.populate(unicodes=subset.parse_unicodes(uni)); s.subset(f)
    out=f'web/fonts/{name}.woff'; f.flavor='woff'; f.save(out)
    import os; print(name, os.path.getsize(out))
