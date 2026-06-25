# -*- coding: utf-8 -*-
"""שרת מקומי קטן לאפליקציית פנקס התרגולים.
מגיש את האפליקציה ושומר גיבויים אוטומטית לתיקיית 'גיבויים' שבפרויקט."""
import http.server, os, json, datetime

PORT = 8765
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.abspath(os.path.join(APP_DIR, "..", "גיבויים"))
os.makedirs(BACKUP_DIR, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=APP_DIR, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        if self.path.rstrip("/") == "/save-backup":
            try:
                n = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(n)
                json.loads(body.decode("utf-8"))  # ודא שזה JSON תקין
                ts = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
                fname = f"פנקס-תרגולים-גיבוי-{ts}.json"
                with open(os.path.join(BACKUP_DIR, fname), "wb") as f:
                    f.write(body)
                self._json(200, {"ok": True, "file": fname, "dir": BACKUP_DIR})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
        else:
            self._json(404, {"ok": False, "error": "not found"})

    def _json(self, code, obj):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(obj, ensure_ascii=False).encode("utf-8"))

    def log_message(self, *a):
        pass  # שקט בלוג

http.server.ThreadingHTTPServer.allow_reuse_address = True
with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"פנקס התרגולים רץ בכתובת:  http://localhost:{PORT}")
    print(f"גיבויים נשמרים אל:  {BACKUP_DIR}")
    print("להשארת האפליקציה פעילה — אל תסגרי חלון זה. לסגירה: Ctrl+C")
    httpd.serve_forever()
