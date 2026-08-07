"""앱 아이콘 생성기.

디자인 시스템(네오브루탈 팝)을 그대로 따른다:
  - 크림 배경, 굵은 검정 테두리, 하드 오프셋 그림자
  - 글리프는 앱이 정답 배지로 쓰는 ⭕ 표시

안드로이드 어댑티브 아이콘은 바깥 1/3이 런처 마스크에 잘릴 수 있다.
그래서 전경 글리프는 캔버스 중앙 66%(안전 영역) 안에 들어가야 한다.
여기서는 링 바깥 반지름을 290px(캔버스 1024 기준 중심에서 28%)로 잡아
어떤 마스크 모양에서도 잘리지 않는다.

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

    # 어댑티브 아이콘: 배경 판 + 전경 글리프를 따로 낸다.
    Image.new("RGBA", (SIZE, SIZE), CREAM).save(f"{out}/android-icon-background.png")
    glyph(ADAPTIVE).save(f"{out}/android-icon-foreground.png")

    # 테마 아이콘(모노크롬)은 실루엣만 쓴다. 색과 그림자는 무의미하므로 뺀다.
    glyph(ADAPTIVE, ring_fill=INK, shadow=False).save(f"{out}/android-icon-monochrome.png")

    # 일반 아이콘 / 스플래시 / 파비콘
    glyph(PLAIN, bg=CREAM).save(f"{out}/icon.png")
    glyph(PLAIN, bg=CREAM).save(f"{out}/splash-icon.png")
    glyph(PLAIN, bg=CREAM).resize((196, 196), Image.LANCZOS).save(f"{out}/favicon.png")

    print("icons written to", out)


if __name__ == "__main__":
    main()
