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

import io
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


def extra_chars() -> str:
    """콘텐츠에 실제로 쓰인, 위 범위 밖의 글자를 모은다.

    고사성어 고사는 한자를 그대로 보여준다(過猶不及처럼). 범위만으로 자르면
    그 글자들이 두부(□)로 뜨므로, 콘텐츠 JSON을 훑어 쓰이는 글자만 골라 넣는다.
    한자 2만 자를 다 넣는 게 아니라 실제 등장하는 수십 자만 들어간다.

    이 목록이 폰트와 어긋나면 tools/validate-content.ts가 릴리스 게이트에서
    잡아낸다 — 새 한자를 문항에 넣고 이 스크립트를 다시 안 돌리면 실패한다.
    """
    keep: set[str] = set()
    for path in (ROOT / "src" / "content").rglob("*.json"):
        for ch in path.read_text(encoding="utf-8"):
            cp = ord(ch)
            in_base = (
                0x20 <= cp <= 0x7E or 0xA0 <= cp <= 0xFF
                or 0x2010 <= cp <= 0x2015 or 0x2018 <= cp <= 0x201F
                or cp in (0x2026, 0x2030, 0x20A9)
                or 0x2190 <= cp <= 0x21FF or 0x2700 <= cp <= 0x27BF
                or 0x1100 <= cp <= 0x11FF or 0x3130 <= cp <= 0x318F
                or 0xAC00 <= cp <= 0xD7A3
            )
            # 이모지(0x1F000 위)는 시스템 이모지 폰트가 그리므로 넣지 않는다.
            if not in_base and cp > 0x2FF and cp < 0x1F000:
                keep.add(ch)
    return "".join(sorted(keep))


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    total_before = total_after = 0

    extra = extra_chars()
    print(f"콘텐츠에서 찾은 범위 밖 글자 {len(extra)}자: {extra}\n")

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
                f"--text={extra}",
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
