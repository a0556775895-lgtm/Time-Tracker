import struct, zlib, os

def png(size, color=(99, 102, 241)):
    w = h = size
    raw = b''.join(b'\x00' + bytes([*color, 255]) * w for _ in range(h))
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
            chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b''))

os.makedirs('images', exist_ok=True)
for size in [48, 128]:
    with open(f'images/icon{size}.png', 'wb') as f:
        f.write(png(size))
    print(f'Created icon{size}.png')
