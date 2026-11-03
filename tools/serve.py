"""Local dev server that tells the browser never to cache, so an edited
module is always picked up together with the rest.

    python tools/serve.py 8770
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
    root = Path(__file__).resolve().parent.parent
    ThreadingHTTPServer(("", port), partial(NoCache, directory=str(root))).serve_forever()
