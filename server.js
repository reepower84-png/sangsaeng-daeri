// 로컬 테스트용 정적 서버 (PWA/서비스워커 확인용)
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const PORT = 5173;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  const f = path.join(root, u);
  fs.readFile(f, (e, data) => {
    if (e) { res.writeHead(404); res.end('404 Not Found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log('상생대리운전 서버 실행: http://localhost:' + PORT));
