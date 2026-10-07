"""Original Cryptidle pixel drawings. Deterministic, no third-party art."""
from PIL import Image, ImageDraw
from pathlib import Path
import random
ROOT=Path(__file__).resolve().parents[1]/'apps/web/public/art'
ROOT.mkdir(parents=True,exist_ok=True)
INK='#141c27'; SKIN='#d4ac87'; GOLD='#ddba75'
def sprite(name,color,kind,variant=0):
 sheet=Image.new('RGBA',(32*12,48))
 for f in range(12):
  im=Image.new('RGBA',(32,48)); d=ImageDraw.Draw(im)
  state=f//3; t=f%3; bob=1 if t==1 and state<2 else 0
  def r(box,c): d.rectangle((box[0],box[1]+bob,box[2],box[3]+bob),fill=c)
  if kind in ['warrior','mage','priest']:
   r((10,38,14,42),INK);r((18,38,22,42),INK)
   r((8,22,24,37),INK);r((10,23,22,36),color);r((11,24,13,33),'#ffffff66');r((10,34,22,36),GOLD)
   r((10,10,22,22),INK);r((12,12,20,22),SKIN);r((13,17,14,18),INK);r((19,17,20,18),INK)
   if kind=='warrior':
    r((9,10,23,14),color);r((15,9,18,19),'#b3c6cb');r((5,24,9,34),'#879da1');r((4,26,8,31),GOLD)
    x=26 if state!=2 else 27;r((x,15 if state!=2 else 8,x+1,31),'#c5d4d4');r((x-2,30,x+3,31),GOLD)
   else:
    d.polygon([(8,13+bob),(16,3+bob),(24,13+bob)],fill=color)
    r((26,16,27,37),'#93704f');r((24,12,29,17),'#8dddd8' if kind=='mage' else GOLD)
    if kind=='priest':r((15,25,17,32),GOLD);r((13,27,19,29),GOLD)
   if variant:r((11,5,21,7),GOLD);r((7,24,9,37),GOLD)
  else:
   # distinct silhouettes: slime, wolf, bat, skeleton, spider, wraith, knight, imp, golem, boss
   if kind in ['slime','spider']:
    d.ellipse((5,23+bob,27,40+bob),fill=INK);d.ellipse((7,24+bob,25,38+bob),fill=color)
    if kind=='spider':
     for y in [25,31,37]:d.line((2,y,9,y+4),fill=color,width=2);d.line((24,y+4,30,y),fill=color,width=2)
   elif kind in ['bat','imp']:
    d.polygon([(2,15),(11,22),(16,13),(21,22),(30,15),(28,32),(21,28),(16,40),(11,28),(4,32)],fill=INK)
    d.polygon([(3,17),(12,24),(16,16),(20,24),(29,17),(26,29),(21,26),(16,37),(11,26),(6,29)],fill=color)
   elif kind=='wolf':
    r((5,26,27,36),INK);r((7,27,25,35),color);r((20,16,29,29),color);r((21,12,23,18),color);r((27,12,29,18),color);r((7,35,10,41),color);r((22,35,25,41),color)
   else:
    r((7,23,26,37),INK);r((9,23,24,36),color);r((10,10,23,24),INK);r((12,12,21,24),color);r((9,36,13,42),color);r((21,36,25,42),color)
    if kind in ['knight','boss','golem']:r((4,23,9,34),color);r((25,23,29,34),color);r((14,25,20,32),GOLD)
    if kind=='boss':r((8,6,11,14),GOLD);r((22,6,25,14),GOLD);r((6,7,9,9),GOLD);r((24,7,27,9),GOLD)
   r((12,26 if kind in ['slime','spider'] else 18,14,27 if kind in ['slime','spider'] else 19),'#ffbd79');r((20,26 if kind in ['slime','spider'] else 18,22,27 if kind in ['slime','spider'] else 19),'#ffbd79')
  if state==1: im=im.transform((32,48),Image.Transform.AFFINE,(1,0,(t-1),0,1,0))
  if state==2 and t==1: im=im.transform((32,48),Image.Transform.AFFINE,(1,0,-2,0,1,0))
  if state==3:
   alpha=im.getchannel('A').point(lambda a:int(a*(1-t*.35)));im.putalpha(alpha);fallen=im.resize((32,48-t*12),Image.Resampling.NEAREST);im=Image.new('RGBA',(32,48));im.alpha_composite(fallen,(0,t*12))
  sheet.alpha_composite(im,(f*32,0))
 sheet.save(ROOT/(name+'.png'))
for cls,col in [('warrior','#718c9b'),('mage','#8b77b4'),('priest','#d6c69a')]:
 sprite(cls+'-0',col,cls);sprite(cls+'-1',{'warrior':'#aa6262','mage':'#4eaaa3','priest':'#d1a057'}[cls],cls,1)
for i,(kind,col) in enumerate([('wolf','#8b949a'),('slime','#799d75'),('bat','#947ba2'),('skeleton','#c5baa0'),('wraith','#5aaba7'),('spider','#9d6e79'),('knight','#738595'),('wraith','#be7764'),('golem','#93977d'),('boss','#867a9d')]):sprite('monster-'+str(i),col,kind)
for name,col in [('weapon','#c0d6df'),('head','#8fabb6'),('chest','#78939c'),('accessory','#d5a95d'),('potion','#d76477'),('gold','#e4b767'),('xp','#8ca9da'),('skill','#81c6b4')]:
 im=Image.new('RGBA',(24,24));d=ImageDraw.Draw(im)
 if name=='weapon':d.polygon([(17,2),(21,2),(21,6),(10,17),(7,14)],fill=col);d.line((5,12,13,20),fill=GOLD,width=3);d.line((7,17,3,21),fill='#9a765a',width=3)
 elif name=='head':d.rectangle((5,7,19,19),fill=col);d.rectangle((8,3,16,8),fill=col);d.rectangle((7,13,17,15),fill=INK)
 elif name=='chest':d.polygon([(8,4),(16,4),(22,8),(19,13),(17,11),(17,21),(6,21),(6,11),(3,13),(1,8)],fill=col);d.line((8,5,8,18),fill='#b7c4b9',width=2)
 elif name=='potion':d.rectangle((9,2,15,7),fill=GOLD);d.ellipse((5,6,19,21),fill=col);d.rectangle((8,9,10,15),fill='#ffadba')
 else:d.ellipse((4,4,20,20),fill=col);d.ellipse((7,7,17,17),outline=GOLD,width=2);d.rectangle((11,8,13,16),fill='#f3e1ae')
 im.save(ROOT/(name+'.png'))
print('Created 16 sprite sheets and 8 icons')
