// 상생대리운전 PWA 아이콘 생성기 (의존성 없음, Node 내장 모듈만 사용)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePNG(size, draw) {
  const channels = 4; // RGBA
  const raw = Buffer.alloc(size * (size * channels + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * channels + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const px = draw(x, y, size);
      const i = rowStart + 1 + x * channels;
      raw[i] = px[0]; raw[i + 1] = px[1]; raw[i + 2] = px[2]; raw[i + 3] = px[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// 스티어링 휠 로고 그리기
function draw(x, y, size) {
  const cx = size / 2, cy = size / 2;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 배경: 대각선 그라데이션 (밝은 파랑 -> 진한 파랑)
  const top = [0x2f, 0x80, 0xff];   // #2F80FF
  const bot = [0x0b, 0x3f, 0xb0];   // #0B3FB0
  const t = Math.min(1, Math.max(0, (x + y) / (2 * size)));
  let col = mix(top, bot, t);

  const white = [0xff, 0xff, 0xff];
  const outerR = size * 0.345;
  const rimThick = size * 0.072;
  const hubR = size * 0.072;
  const spokeHalf = size * 0.05;

  let onWheel = false;

  // 바깥 림
  if (dist <= outerR && dist >= outerR - rimThick) onWheel = true;
  // 중앙 허브
  if (dist <= hubR) onWheel = true;
  // 스포크 3개 (-90, 30, 150도)
  const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
  for (const a of angles) {
    const ca = Math.cos(a), sa = Math.sin(a);
    const along = dx * ca + dy * sa;       // 스포크 방향
    const perp = -dx * sa + dy * ca;       // 수직 거리
    if (along >= hubR * 0.4 && along <= outerR - rimThick * 0.5 && Math.abs(perp) <= spokeHalf) {
      onWheel = true;
    }
  }

  if (onWheel) {
    // 림에 약간의 입체감
    const shade = 1 - (y / size) * 0.12;
    col = [Math.round(white[0] * shade), Math.round(white[1] * shade), Math.round(white[2] * shade)];
  }

  return [col[0], col[1], col[2], 255];
}

const dir = __dirname;
const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
  ['favicon-32.png', 32],
];

for (const [name, size] of targets) {
  const png = makePNG(size, draw);
  fs.writeFileSync(path.join(dir, name), png);
  console.log('생성됨:', name, size + 'x' + size, png.length + ' bytes');
}
console.log('아이콘 생성 완료');
