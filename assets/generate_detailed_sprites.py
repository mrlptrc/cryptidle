"""Deterministic, original pixel-art combat sheets for the forest scene.

The sheets use a 96x144 logical cell and nearest-neighbour pixels.  They are
deliberately drawn in layers so the silhouette, armor planes and attack poses
remain readable at the in-game size.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "apps/web/public/art"
ROOT.mkdir(parents=True, exist_ok=True)
OUT = (96, 144)
INK = "#171b27"; SHADE = "#293445"; STEEL = "#8198a6"; HI = "#c7d2cc"
LEATHER = "#624438"; BURG = "#8f3f4e"; SKIN = "#d8a47f"; GOLD = "#d7b866"

def warrior(frame, action):
    im = Image.new("RGBA", OUT); d = ImageDraw.Draw(im)
    bob = [0, -2, 0, 1, 0, 2][frame]
    cx = 47 + ([0, 1, 0, -1, 1, 0][frame] if action == "walk" else 0)
    base = 125 + bob
    # contact shadow stays fixed across every action
    d.ellipse((18, 128, 78, 138), fill=(8, 12, 16, 125))
    # cape silhouette and folds
    cape = [(cx-22, 49+bob), (cx+16, 47+bob), (cx+36, 69+bob), (cx+29, 114+bob), (cx+3, 98+bob)]
    d.polygon(cape, fill=INK); d.polygon([(x-2, y+2) for x,y in cape], fill=BURG)
    d.line((cx+12, 56+bob, cx+23, 99+bob), fill="#bd5a5d", width=3)
    # legs, greaves and boots
    stride = [-3, 3, -2, 2, -4, 1][frame] if action == "walk" else 0
    for x in (cx-12+stride, cx+10-stride):
        d.polygon([(x, 90+bob), (x+12, 90+bob), (x+10, 121+bob), (x+2, 126+bob), (x-2, 121+bob)], fill=INK)
        d.polygon([(x+2, 92+bob), (x+10, 92+bob), (x+8, 117+bob), (x+2, 119+bob)], fill=STEEL)
        d.rectangle((x-2, 121+bob, x+13, 128+bob), fill=INK); d.rectangle((x, 120+bob, x+10, 124+bob), fill=LEATHER)
    # torso armor, belt and shoulder
    d.polygon([(cx-20, 48+bob), (cx+16, 48+bob), (cx+23, 90+bob), (cx-16, 94+bob)], fill=INK)
    d.polygon([(cx-15, 53+bob), (cx+12, 53+bob), (cx+16, 86+bob), (cx-11, 88+bob)], fill=STEEL)
    d.polygon([(cx-9, 56+bob), (cx+2, 56+bob), (cx+5, 84+bob), (cx-5, 84+bob)], fill=HI)
    d.rectangle((cx-17, 84+bob, cx+18, 92+bob), fill=LEATHER); d.rectangle((cx-2, 84+bob, cx+4, 91+bob), fill=GOLD)
    d.polygon([(cx-22, 53+bob), (cx-8, 48+bob), (cx-1, 64+bob), (cx-13, 74+bob)], fill=INK); d.polygon([(cx-19, 55+bob), (cx-9, 52+bob), (cx-4, 63+bob), (cx-13, 69+bob)], fill=HI)
    # head, hair and scarf
    d.rectangle((cx-12, 25+bob, cx+12, 53+bob), fill=INK); d.rectangle((cx-8, 31+bob, cx+9, 51+bob), fill=SKIN)
    d.polygon([(cx-14, 35+bob), (cx-10, 21+bob), (cx+5, 17+bob), (cx+15, 29+bob), (cx+8, 34+bob), (cx-2, 25+bob)], fill="#6d3c35")
    d.rectangle((cx-16, 48+bob, cx+15, 56+bob), fill=BURG); d.rectangle((cx-5, 49+bob, cx+9, 54+bob), fill="#bd5a5d")
    d.rectangle((cx-4, 38+bob, cx-1, 41+bob), fill=INK); d.rectangle((cx+6, 38+bob, cx+9, 41+bob), fill=INK)
    # shield on left arm
    d.polygon([(cx-32, 56+bob), (cx-13, 61+bob), (cx-14, 93+bob), (cx-25, 104+bob), (cx-35, 90+bob)], fill=INK)
    d.polygon([(cx-29, 61+bob), (cx-16, 65+bob), (cx-17, 89+bob), (cx-25, 97+bob), (cx-31, 87+bob)], fill="#4a6079")
    d.line((cx-25, 67+bob, cx-25, 91+bob), fill=GOLD, width=2); d.line((cx-30, 78+bob, cx-20, 78+bob), fill=GOLD, width=2)
    # sword angle changes during attack/skill
    angle = [(cx+22, 57, cx+43, 94), (cx+24, 60, cx+49, 87), (cx+18, 72, cx+49, 40), (cx+15, 82, cx+52, 56), (cx+23, 55, cx+43, 25), (cx+21, 65, cx+50, 25)][frame] if action in ("attack", "skill") else (cx+23, 62, cx+47, 100)
    x1,y1,x2,y2=angle; d.line((x1,y1+bob,x2,y2+bob), fill=INK, width=8); d.line((x1,y1+bob,x2,y2+bob), fill=HI, width=4); d.line((x1-4,y1+bob+2,x1+7,y1+bob+7), fill=GOLD, width=4)
    if action == "skill": d.arc((cx-2, 26+bob, cx+72, 112+bob), 200, 330, fill="#f4c870", width=3)
    if action == "hurt": d.line((cx-22, 40+bob, cx+25, 98+bob), fill="#c55e64", width=3)
    if action == "death": d.polygon([(cx-20, 101+bob), (cx+28, 112+bob), (cx+23, 127+bob), (cx-30, 127+bob)], fill=SHADE)
    return im

def bat(frame, action):
    im=Image.new("RGBA",OUT); d=ImageDraw.Draw(im); bob=[0,-4,-2,2,4,1][frame]
    cx,cy=48,65+bob; d.ellipse((18,120,78,130),fill=(8,12,16,100))
    wing=([(cx-10,cy-8),(cx-43,cy-33),(cx-34,cy+8),(cx-17,cy+18)] if frame%2 else [(cx-10,cy-8),(cx-47,cy-12),(cx-30,cy+20),(cx-15,cy+18)])
    wing2=[(2*cx-x, y) for x,y in wing]
    d.polygon(wing,fill=INK); d.polygon(wing2,fill=INK)
    d.polygon([(x+3,y+3) for x,y in wing],fill="#28545d"); d.polygon([(x-3,y+3) for x,y in wing2],fill="#28545d")
    d.line((cx-12,cy,cx-34,cy-18),fill="#5b9a98",width=2); d.line((cx+12,cy,cx+34,cy-18),fill="#5b9a98",width=2)
    d.ellipse((cx-15,cy-17,cx+15,cy+20),fill=INK); d.ellipse((cx-11,cy-12,cx+11,cy+15),fill="#4d3b58")
    d.polygon([(cx-10,cy-10),(cx-5,cy-27),(cx,cy-13),(cx+5,cy-27),(cx+10,cy-10)],fill=INK)
    d.rectangle((cx-8,cy-2,cx-3,cy+3),fill="#e4b45f"); d.rectangle((cx+3,cy-2,cx+8,cy+3),fill="#e4b45f")
    if action=="attack": d.line((cx-26,cy+22,cx+26,cy+22),fill="#d77e70",width=3)
    if action=="hurt": d.line((cx-22,cy-25,cx+22,cy+28),fill="#d77e70",width=3)
    if action=="death": d.polygon([(cx-35,cy+28),(cx+35,cy+28),(cx+18,cy+38),(cx-18,cy+38)],fill="#293445")
    return im

def sheet(kind, action):
    out=Image.new("RGBA",(96*6,144))
    for i in range(6): out.alpha_composite(warrior(i,action) if kind=="warrior" else bat(i,action),(i*96,0))
    out.save(ROOT/f"{kind}-forest-{action}.png")

for kind, actions in (("warrior",("idle","walk","attack","skill","hurt","death")),("bat",("idle","move","attack","hurt","death"))):
    for action in actions: sheet(kind,action)
print("created detailed forest combat sheets")
