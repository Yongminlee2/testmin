"""번들 폰트에서 이 앱이 절대 쓰지 않는 글리프를 걷어낸다.

왜 필요한가
-----------
Noto Sans KR은 한글뿐 아니라 한자 약 2만 자와 가나까지 담은 전체 CJK 폰트라
굵기 하나가 5.9MB다. 이 앱은 세 굵기를 쓰므로 17.7MB를 시작할 때 파싱하고,
그동안 `app/_layout.tsx`가 `return null`로 화면을 아예 안 그린다.
"문항도 몇 개 없는데 왜 이렇게 오래 걸리냐"의 진짜 원인이 이것이다.

이 앱은 한자도 가나도 화면에 띄우지 않는다. 걷어내도 잃는 것이 없다.

무엇을 남기는가
--------------
- 현대 한글 음절 전체(U+AC00~D7A3, 11,172자) — 일부만 남기면 드문 글자가
  두부(tofu)로 뜬다. 문항이 늘어날 것이므로 음절은 통째로 남긴다.
- 한글 자모(자음/모음 낱자를 따로 쓰는 자리)
- 라틴/숫자/문장부호, 그리고 화면에 실제로 쓰는 · × → ↻ 같은 기호

이모지(⭕ ❌ 📤 …)는 이 폰트가 아니라 시스템 이모지 폰트가 그린다. 여기 없어도 된다.

실행: python tools/subset-fonts.py
"""

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "fonts"

SOURCES = {
    "NotoSansKR_500Medium": "noto-sans-kr/500Medium/NotoSansKR_500Medium.ttf",
    "NotoSansKR_700Bold": "noto-sans-kr/700Bold/NotoSansKR_700Bold.ttf",
    "NotoSansKR_900Black": "noto-sans-kr/900Black/NotoSansKR_900Black.ttf",
    "BlackHanSans_400Regular": "black-han-sans/400Regular/BlackHanSans_400Regular.ttf",
}

UNICODES = ",".join([
    "U+0020-007E",    # 기본 라틴 + 숫자
    "U+00A0-00FF",    # 라틴-1 (· 는 U+00B7, × 는 U+00D7)
    "U+2010-2015",    # 각종 대시
    "U+2018-201F",    # 따옴표
    "U+2026",         # …
    "U+2030",         # ‰
    "U+20A9",         # ₩
    "U+2190-21FF",    # 화살표 (→ ↻)
    "U+2700-27BF",    # 딩뱃 (✎)
    "U+1100-11FF",    # 한글 자모
    "U+3130-318F",    # 한글 호환 자모
    "U+AC00-D7A3",    # 현대 한글 음절 전체
])


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    total_before = total_after = 0

    for name, rel in SOURCES.items():
        src = ROOT / "node_modules" / "@expo-google-fonts" / rel
        if not src.exists():
            print(f"[건너뜀] 원본 없음: {src}")
            continue
        dst = OUT / f"{name}.ttf"
        before = src.stat().st_size

        subprocess.run(
            [
                sys.executable, "-m", "fontTools.subset", str(src),
                f"--unicodes={UNICODES}",
                f"--output-file={dst}",
                "--layout-features=*",   # 자모 합성 등 한글 조판 기능은 남긴다
                "--name-IDs=*",
                "--drop-tables+=DSIG",
            ],
            check=True,
            capture_output=True,
        )

        after = dst.stat().st_size
        total_before += before
        total_after += after
        print(f"{name:26} {before/1048576:6.2f}MB → {after/1048576:5.2f}MB "
              f"({(1 - after/before) * 100:4.1f}% 감소)")

    # OFL 라이선스는 서브셋 재배포 시에도 함께 실어야 한다.
    for pkg in ("noto-sans-kr", "black-han-sans"):
        for lic in (ROOT / "node_modules" / "@expo-google-fonts" / pkg).glob("*LICENSE*"):
            shutil.copy(lic, OUT / f"{pkg}-{lic.name}")

    if total_before:
        print(f"\n합계 {total_before/1048576:.2f}MB → {total_after/1048576:.2f}MB "
              f"({(1 - total_after/total_before) * 100:.1f}% 감소)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
