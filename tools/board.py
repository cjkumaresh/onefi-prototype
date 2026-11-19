import sys
from PIL import Image, ImageDraw, ImageFont
names=sys.argv[2:]; out=sys.argv[1]
ims=[Image.open(n).convert('RGB') for n in names]
w,h=ims[0].size; s=0.5; W,H=int(w*s),int(h*s); g=40
B=Image.new('RGB',(len(ims)*(W+g)+g, H+2*g),(30,30,32))
for i,im in enumerate(ims):
    im=im.resize((W,H),Image.LANCZOS)
    m=Image.new('L',(W,H),0); ImageDraw.Draw(m).rounded_rectangle((0,0,W-1,H-1),radius=34,fill=255)
    B.paste(im,(g+i*(W+g),g),m)
B.save(out)
