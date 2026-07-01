import http.server
import socketserver
import os

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not '.' in self.path:
            # Try appending .html
            if os.path.exists(path + '.html'):
                self.path += '.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

PORT = 3000
handler = MyHttpRequestHandler
with socketserver.TCPServer(("", PORT), handler) as httpd:
    print("Serving at port", PORT)
    httpd.serve_forever()
