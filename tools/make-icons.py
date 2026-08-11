"""선택한 마스터 이미지에서 앱·웹·스토어 아이콘을 일괄 생성한다.

마스터: store/assets/icon-master-personality-wheel.png
실행: python tools/make-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "store/assets/icon-master-personality-wheel.png"
APP_IMAGES = ROOT / "assets/images"
STORE_ASSETS = ROOT / "store/assets"
PUBLIC = ROOT / "public"

YELLOW = (255, 215, 55)
CREAM = (255, 248, 225)
INK = (17, 17, 17)
MUTED = (84, 78, 67)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(ROOT / path), size=size)


def load_square_master() -> Image.Image:
    if not MASTER.exists():
        raise FileNotFoundError(f"마스터 아이콘이 없습니다: {MASTER}")

    source = Image.open(MASTER).convert("RGB")
    side = min(source.size)
    source = ImageOps.fit(source, (side, side), method=Image.Resampling.LANCZOS)

    # 원본 가장자리의 검은 바탕과 테두리는 모서리에서 연결돼 있다. 이를 노란색으로
    # flood-fill해 제거하면 얼굴의 검은 눈·입은 보존하면서 원본 구도를 자르지 않아도 된다.
    # 예전 7% 크롭은 캐릭터의 입과 위쪽 색종이가 잘려 보이는 원인이었다.
    for corner in ((0, 0), (side - 1, 0), (0, side - 1), (side - 1, side - 1)):
        ImageDraw.floodfill(source, corner, YELLOW, thresh=128)

    return source


def adaptive_foreground(icon: Image.Image, size: int = 1024) -> Image.Image:
    # Android adaptive icon의 원형·물방울형 마스크에서도 얼굴과 네 캐릭터가 남도록
    # 전체 구도를 안전 영역 안으로 줄인다.
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Adaptive Icon의 어떤 마스크에서도 안전한 중앙 약 66% 안에 핵심 구도가 들어가야 한다.
    # 64%로 두어 Samsung 원형 마스크에서도 얼굴·룰렛·네 감정 캐릭터가 잘리지 않게 한다.
    inner = int(size * 0.64)
    artwork = icon.resize((inner, inner), Image.Resampling.LANCZOS).convert("RGBA")
    alpha = Image.new("L", (inner, inner), 0)
    ImageDraw.Draw(alpha).rounded_rectangle(
        (0, 0, inner - 1, inner - 1), radius=int(inner * 0.15), fill=255
    )
    alpha = alpha.filter(ImageFilter.GaussianBlur(8))
    artwork.putalpha(alpha)
    canvas.alpha_composite(artwork, ((size - inner) // 2, (size - inner) // 2))
    return canvas


def monochrome_icon(size: int = 1024) -> Image.Image:
    # 선택 아이콘의 '머리 위 성격 룰렛' 실루엣을 한 색으로 단순화한다.
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    black = (0, 0, 0, 255)
    draw.ellipse((225, 145, 799, 670), fill=black)  # 성격 룰렛
    draw.ellipse((275, 430, 749, 925), fill=black)  # 얼굴
    draw.polygon(((505, 405), (450, 570), (570, 535)), fill=(0, 0, 0, 0))
    return image


def gradient(size: tuple[int, int]) -> Image.Image:
    width, height = size
    image = Image.new("RGB", size)
    draw = ImageDraw.Draw(image)
    for x in range(width):
        t = x / max(1, width - 1)
        color = tuple(round(CREAM[i] * (1 - t) + YELLOW[i] * t) for i in range(3))
        draw.line((x, 0, x, height), fill=color)
    return image


def draw_marketing_canvas(icon: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    image = gradient(size)
    draw = ImageDraw.Draw(image)
    title_font = font("assets/fonts/BlackHanSans_400Regular.ttf", round(height * 0.16))
    subtitle_font = font("assets/fonts/NotoSansKR_700Bold.ttf", round(height * 0.052))
    small_font = font("assets/fonts/NotoSansKR_500Medium.ttf", round(height * 0.035))

    icon_size = round(height * 0.87)
    icon_art = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    icon_x = width - icon_size - round(width * 0.035)
    icon_y = (height - icon_size) // 2
    image.paste(icon_art, (icon_x, icon_y))

    left = round(width * 0.065)
    draw.text((left, round(height * 0.22)), "테스트의 민족", font=title_font, fill=INK)
    draw.text(
        (left, round(height * 0.49)),
        "내 심리를 맞혀보는 코믹 테스트",
        font=subtitle_font,
        fill=MUTED,
    )
    draw.rounded_rectangle(
        (left, round(height * 0.67), left + round(width * 0.30), round(height * 0.80)),
        radius=round(height * 0.065),
        fill=(255, 255, 255),
        outline=INK,
        width=max(2, round(height * 0.007)),
    )
    draw.text(
        (left + round(width * 0.025), round(height * 0.695)),
        "IQ · MBTI식 16유형 · 심리",
        font=small_font,
        fill=INK,
    )
    return image


def main() -> None:
    APP_IMAGES.mkdir(parents=True, exist_ok=True)
    STORE_ASSETS.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)

    master = load_square_master()
    icon = master.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon.save(APP_IMAGES / "icon.png", optimize=True)
    adaptive_foreground(icon).save(APP_IMAGES / "android-icon-foreground.png", optimize=True)
    Image.new("RGBA", (1024, 1024), (*YELLOW, 255)).save(
        APP_IMAGES / "android-icon-background.png", optimize=True
    )
    monochrome_icon().save(APP_IMAGES / "android-icon-monochrome.png", optimize=True)

    favicon = icon.resize((196, 196), Image.Resampling.LANCZOS)
    favicon.save(APP_IMAGES / "favicon.png", optimize=True)
    favicon.save(PUBLIC / "favicon.png", optimize=True)
    icon.resize((512, 512), Image.Resampling.LANCZOS).save(
        STORE_ASSETS / "play-icon-512.png", optimize=True
    )

    icon.resize((180, 180), Image.Resampling.LANCZOS).save(
        PUBLIC / "apple-touch-icon.png", optimize=True
    )
    icon.resize((192, 192), Image.Resampling.LANCZOS).save(
        PUBLIC / "icon-192.png", optimize=True
    )
    icon.resize((512, 512), Image.Resampling.LANCZOS).save(
        PUBLIC / "icon-512.png", optimize=True
    )

    feature = draw_marketing_canvas(icon, (1024, 500))
    feature.save(STORE_ASSETS / "feature-graphic-1024x500.png", optimize=True)
    social = draw_marketing_canvas(icon, (1200, 630))
    social.save(STORE_ASSETS / "social-preview-1200x630.png", optimize=True)

    print("앱·웹·스토어 아이콘과 공유 이미지를 생성했습니다.")


if __name__ == "__main__":
    main()
