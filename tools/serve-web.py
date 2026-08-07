"""정적 웹 내보내기(dist)를 GitHub Pages와 같은 방식으로 서빙하는 로컬 서버.

GitHub Pages는 /foo 요청에 foo.html을 돌려준다. 파이썬 기본 http.server는
확장자를 붙여야만 찾으므로, 로컬에서 확인하면 배포본과 다르게 동작한다
(라우트가 /foo.html로 잡혀 "Unmatched Route"가 뜬다).

사용법:
    python tools/serve-web.py [포트]

배포 경로(/testmin)까지 똑같이 재현하므로, 브라우저에서
http://localhost:8741/testmin/ 을 열면 실제 배포본과 같은 상태가 된다.
"""

from __future__ import annotations

import functools
import http.server
import socketserver
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
BASE = "/testmin"  # app.json의 expo.experiments.baseUrl과 같아야 한다


class PagesHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        # 배포 경로 접두사를 떼어낸다
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean == BASE:
            clean = "/"
        elif clean.startswith(BASE + "/"):
            clean = clean[len(BASE):]

        local = super().translate_path(clean)
        candidate = Path(local)
        if candidate.is_dir():
            index = candidate / "index.html"
            if index.exists():
                return str(index)
        if not candidate.exists():
            # GitHub Pages와 같은 규칙: /foo → foo.html
            with_html = Path(local + ".html")
            if with_html.exists():
                return str(with_html)
        return local

    def log_message(self, fmt: str, *args: object) -> None:  # 조용히
        pass


def main() -> int:
    if not DIST.exists():
        print(f"dist가 없습니다: {DIST}\n먼저 `npx expo export --platform web`을 실행하세요.")
        return 1

    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8741
    # 여기서 os.chdir(DIST)를 하면 안 된다 — 윈도우에서 서버가 dist를 잡고 있어
    # 다음 `expo export`가 EBUSY로 실패한다. 핸들러에 directory만 넘긴다.
    handler = functools.partial(PagesHandler, directory=str(DIST))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
        print(f"http://localhost:{port}{BASE}/ 에서 확인하세요 (Ctrl+C로 종료)")
        httpd.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
