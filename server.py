from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
from datetime import datetime

class EditHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/save':
            # Les innholdet fra forespørselen
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Lag filnavn med tidsstempel
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"editfiles/{data['page']}_{timestamp}.md"
            
            # Lagre filen
            os.makedirs('editfiles', exist_ok=True)
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(data['content'])
            
            # Send respons
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'file': filename}).encode())
            return

        return SimpleHTTPRequestHandler.do_POST(self)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# Start serveren
server = HTTPServer(('localhost', 8000), EditHandler)
print("Server kjører på http://localhost:8000")
server.serve_forever()
