#!/usr/bin/env python3
"""Generate BudgetApp PWA icons from the in-app logo mark.

The mark matches components/auth/budget-app-logo.tsx: a #7c3aed tile,
a white rounded card, and two purple strokes. Maskable and standard
icons share that artwork because the card already sits inside the
Android adaptive-icon safe zone. No third-party imaging library.
"""

import struct
import zlib
from pathlib import Path

PURPLE = (0x7C, 0x3A, 0xED, 255)
WHITE = (255, 255, 255, 255)
ROOT = Path(__file__).resolve().parents[1] / "public" / "icons"

# Logo geometry in a 32-unit viewBox.
CARD = (9.0, 10.0, 14.0, 12.0, 2.5)
LINE_WIDTH = 1.75
LINES = (
    (12.0, 15.5, 20.0, 15.5),
    (12.0, 18.0, 17.0, 18.0),
)


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def inside_round_rect(x: float, y: float, left: float, top: float, width: float, height: float, radius: float) -> bool:
    right = left + width
    bottom = top + height
    if x < left or x > right or y < top or y > bottom:
        return False
    radius = min(radius, width / 2, height / 2)
    dx = 0.0
    dy = 0.0
    if x < left + radius:
        dx = left + radius - x
    elif x > right - radius:
        dx = x - (right - radius)
    if y < top + radius:
        dy = top + radius - y
    elif y > bottom - radius:
        dy = y - (bottom - radius)
    return dx * dx + dy * dy <= radius * radius


def distance_to_segment(px: float, py: float, x1: float, y1: float, x2: float, y2: float) -> float:
    dx = x2 - x1
    dy = y2 - y1
    length_sq = dx * dx + dy * dy
    if length_sq == 0:
        return ((px - x1) ** 2 + (py - y1) ** 2) ** 0.5
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / length_sq))
    qx = x1 + t * dx
    qy = y1 + t * dy
    return ((px - qx) ** 2 + (py - qy) ** 2) ** 0.5


def sample(x: float, y: float, scale: float) -> tuple[int, int, int, int]:
    unit_x = x / scale
    unit_y = y / scale
    left, top, width, height, radius = CARD
    if inside_round_rect(unit_x, unit_y, left, top, width, height, radius):
        half = LINE_WIDTH / 2
        for x1, y1, x2, y2 in LINES:
            if distance_to_segment(unit_x, unit_y, x1, y1, x2, y2) <= half:
                return PURPLE
        return WHITE
    return PURPLE


def render(size: int) -> bytes:
    scale = size / 32
    samples = 4
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            channels = [0, 0, 0, 0]
            for sy in range(samples):
                for sx in range(samples):
                    color = sample(x + (sx + 0.5) / samples, y + (sy + 0.5) / samples, scale)
                    for index, value in enumerate(color):
                        channels[index] += value
            count = samples * samples
            raw.extend(channel // count for channel in channels)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    outputs = {
        192: ("icon-192.png", "icon-maskable-192.png"),
        512: ("icon-512.png", "icon-maskable-512.png"),
        180: ("apple-touch-icon.png",),
    }
    for size, names in outputs.items():
        png = render(size)
        for name in names:
            path = ROOT / name
            path.write_bytes(png)
            print(f"wrote {path.relative_to(ROOT.parent.parent)} ({len(png)} bytes)")


if __name__ == "__main__":
    main()
