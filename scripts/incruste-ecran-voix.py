# Incruste notre écran du guide vocal (scripts/make-step-mockups.cjs avec SCREEN_DIR) sur la photo de l étape « Suivez la voix ». Usage ponctuel.
import numpy as np, sys
from PIL import Image, ImageDraw, ImageFilter
src=Image.open('/root/.claude/uploads/df94f7d4-d51f-5452-9d8e-190c094179be/1999f30e-1000018005.jpg').convert('RGB')
dst=[(762,857),(1068,868),(1039,1536),(727,1529)]  # TL TR BR BL
def coeffs(pa, pb):  # maps output pa -> input pb
    m=[]
    for (x,y),(X,Y) in zip(pa,pb):
        m.append([x,y,1,0,0,0,-X*x,-X*y]); m.append([0,0,0,x,y,1,-Y*x,-Y*y])
    A=np.array(m,float); B=np.array(pb,float).reshape(8)
    return np.linalg.solve(A,B).tolist()
for loc in ['fr','en','ar']:
    scr=Image.open(f'/tmp/claude-0/ecrans/ecran-voice-{loc}.png').convert('RGB')
    w,h=scr.size
    # slight screen glow reduction to sit in the photo
    scr=Image.blend(scr, Image.new('RGB',scr.size,(235,225,215)),0.08)
    m=Image.new('L',(w,h),0); ImageDraw.Draw(m).rounded_rectangle((0,0,w-1,h-1),radius=34,fill=255)
    c=coeffs(dst,[(0,0),(w,0),(w,h),(0,h)])
    warped=scr.transform(src.size,Image.PERSPECTIVE,c,Image.BICUBIC)
    wm=m.transform(src.size,Image.PERSPECTIVE,c,Image.BICUBIC).filter(ImageFilter.GaussianBlur(1))
    a=np.asarray(src).astype(int); R,G,B=a[...,0],a[...,1],a[...,2]
    skin=((R>95)&(R-B>22)&(R>=G)&(R-G>8)).astype(np.uint8)*255
    region=np.zeros_like(skin); region[1300:,:1000]=1; skin=skin*region
    sk=Image.fromarray(skin).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
    mask=Image.fromarray(np.clip(np.asarray(wm).astype(int)-np.asarray(sk).astype(int),0,255).astype(np.uint8))
    out=Image.composite(warped,src,mask)
    out.crop((0,250,1686,1936)).resize((1000,1000),Image.LANCZOS).save(f'/home/user/string-art-platform/apps/web/public/visuels/etapes/voice-photo-{loc}.webp',quality=82)
    if loc=='fr': out.crop((650,800,1150,1650)).save('/tmp/claude-0/ph/compz.png')
