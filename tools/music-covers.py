#!/usr/bin/env python3
"""
Pulls the cover art out of every mp3 in assets/music (the ID3 "APIC" frame), shrinks it to a 400×400 JPEG in
assets/music/covers/, and records it as `cover` in list.js + list.json so the Music app can show it.
Re-run after adding songs:  python3 tools/music-covers.py
"""
import glob, io, json, os, re, struct
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC = os.path.join(ROOT, 'assets', 'music'); COVERS = os.path.join(MUSIC, 'covers'); os.makedirs(COVERS, exist_ok=True)
SIZE, QUALITY = 400, 82

def synch(b): return (b[0] << 21) | (b[1] << 14) | (b[2] << 7) | b[3]

def apic(path):
    """→ image bytes of the first APIC frame, or None. Handles ID3v2.3 / v2.4 (no unsynchronisation, which these files don't use)."""
    with open(path, 'rb') as f: head = f.read(10)
    if head[:3] != b'ID3': return None
    ver, size = head[3], synch(head[6:10])
    with open(path, 'rb') as f: f.seek(10); d = f.read(size)
    pos = 0
    while pos + 10 <= len(d):
        fid = d[pos:pos + 4]
        if not re.match(rb'^[A-Z0-9]{4}$', fid): break
        fsz = synch(d[pos + 4:pos + 8]) if ver == 4 else struct.unpack('>I', d[pos + 4:pos + 8])[0]
        if fid == b'APIC':
            body = d[pos + 10:pos + 10 + fsz]; enc = body[0]
            i = body.index(b'\x00', 1) + 1          # mime type ends
            i += 1                                   # picture type
            if enc in (1, 2):                        # UTF-16 description: ends with 00 00 on an even boundary
                while i + 1 < len(body) and body[i:i + 2] != b'\x00\x00': i += 2
                i += 2
            else: i = body.index(b'\x00', i) + 1
            return body[i:]
        pos += 10 + fsz
    return None

def main():
    lst = json.load(open(os.path.join(MUSIC, 'list.json')))
    done = 0
    for s in lst:
        src = os.path.join(MUSIC, s['file']); name = os.path.splitext(s['file'])[0] + '.jpg'; out = os.path.join(COVERS, name)
        if not os.path.isfile(src): print('missing', s['file']); continue
        if not os.path.isfile(out):
            raw = apic(src)
            if not raw: print('no cover in', s['file']); s.pop('cover', None); continue
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            w, h = im.size; m = min(w, h); im = im.crop(((w - m) // 2, (h - m) // 2, (w - m) // 2 + m, (h - m) // 2 + m)).resize((SIZE, SIZE), Image.LANCZOS)
            im.save(out, 'JPEG', quality=QUALITY, optimize=True, progressive=True); done += 1
        s['cover'] = 'covers/' + name
    json.dump(lst, open(os.path.join(MUSIC, 'list.json'), 'w'), indent=1, ensure_ascii=False)
    with open(os.path.join(MUSIC, 'list.js'), 'w') as f:
        f.write('/* playlist for apps/music.html — loaded as a script so it also works when the site is opened straight from index.html (file://) */\n')
        f.write('window.MUSIC_LIST = ' + json.dumps(lst, indent=1, ensure_ascii=False) + ';\n')
    print(f'{done} covers written, {sum(1 for s in lst if s.get("cover"))}/{len(lst)} songs have one')

if __name__ == '__main__': main()
