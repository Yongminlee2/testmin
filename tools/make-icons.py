"""앱 아이콘 보조 자산 생성기.

`assets/images/icon.png`의 코믹 뇌 캐릭터가 앱 아이콘과 어댑티브 전경,
스플래시의 단일 원본이다. 이 스크립트는 그 래스터 원본을 다시 그리지 않는다.
실행해도 상용 아이콘을 예전 ⭕ 글리프로 덮어쓰지 않게, 아래 보조 자산만 만든다.

  - 어댑티브 배경: 크림 단색
  - 테마 아이콘: 기존 정답 ⭕ 실루엣
  - 파비콘: 현재 icon.png를 196px로 축소

실행: python tools/make-icons.py
"""

from PIL import Image, ImageDraw

SIZE = 1024
C = SIZE // 2

INK = (17, 17, 17, 255)          # colors.ink
CREAM = (255, 248, 225, 255)     # colors.cream
CORAL = (255, 138, 91, 255)      # colors.coral

STROKE = 24      # 검정 테두리 두께

# 어댑티브 아이콘용 — 링과 그림자가 모두 안전 영역(중심에서 338px) 안에 들어와야 한다.
ADAPTIVE = dict(r_out=284, r_in=164, shadow=44)   # 284 + 44 = 328 < 338

# 일반 아이콘용 — 마스크로 잘리지 않으므로 더 크게 채운다.
PLAIN = dict(r_out=356, r_in=205, shadow=52)

# 그림자 거리는 테두리 두께(24)보다 확실히 커야 한다. 비슷하면 별개 그림자로 안 보이고
# 한쪽만 두꺼운 테두리처럼 읽힌다 — 처음 20px으로 잡았다가 실제로 그렇게 나왔다.


def ring(draw, cx, cy, r_out, r_in, fill, outline=None, width=0):
    """도넛 하나. outline이 있으면 안팎 두 원 모두에 테두리를 그린다."""
    draw.ellipse([cx - r_out, cy - r_out, cx + r_out, cy + r_out],
                 fill=fill, outline=outline, width=width)
    # 안쪽을 뚫는다. 배경이 비쳐야 하므로 투명으로 지운다.
    draw.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in],
                 fill=(0, 0, 0, 0))
    if outline is not None:
        draw.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in],
                     outline=outline, width=width)


def glyph(geom, bg=None, ring_fill=CORAL, ink=INK, shadow=True):
    """⭕ 글리프 한 장. bg가 None이면 투명 배경."""
    r_out, r_in, off = geom["r_out"], geom["r_in"], geom["shadow"]
    img = Image.new("RGBA", (SIZE, SIZE), bg if bg else (0, 0, 0, 0))

    if shadow:
        # 하드 오프셋 그림자 — 블러 없이 통짜 검정. 카드 컴포넌트와 같은 처리.
        sh = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        ring(ImageDraw.Draw(sh), C + off, C + off, r_out, r_in, ink)
        img = Image.alpha_composite(img, sh)

    fg = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ring(ImageDraw.Draw(fg), C, C, r_out, r_in, ring_fill, ink, STROKE)
    return Image.alpha_composite(img, fg)


def main():
    out = "assets/images"

    # 전경은 app.json이 icon.png를 직접 읽는다. 여기서는 보조 레이어만 만든다.
    Image.new("RGBA", (SIZE, SIZE), CREAM).save(f"{out}/android-icon-background.png")

    # 테마 아이콘(모노크롬)은 실루엣만 쓴다. 색과 그림자는 무의미하므로 뺀다.
    glyph(ADAPTIVE, ring_fill=INK, shadow=False).save(f"{out}/android-icon-monochrome.png")

    # 파비콘은 상용 아이콘 원본에서만 파생한다.
    with Image.open(f"{out}/icon.png") as icon:
        icon.convert("RGB").resize((196, 196), Image.LANCZOS).save(f"{out}/favicon.png")

    print("icon helper assets written to", out)


if __name__ == "__main__":
    main()
