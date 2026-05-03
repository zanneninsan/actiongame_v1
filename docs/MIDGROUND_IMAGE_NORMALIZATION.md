# Midground Image Normalization

`public/assets/backgrounds/midground` 配下の背景画像を正規化する手順です。

## 目的

- 画像下部に透明な余白がある場合、その下端余白だけを削る。
- crop 後のアスペクト比を維持したまま、高さを `720px` に揃える。
- 出力形式を WebP に統一する。

## 前提

- `ffmpeg` と `ffprobe` が使えること。
- 対象は `public/assets/backgrounds/midground` 直下の `.png`, `.jpg`, `.jpeg`, `.webp`。
- 透明余白判定はアルファ値を見て、最下段から上に向かって不透明ピクセルがある行を探す。
- crop は下方向だけに行い、上端・左右は削らない。

## 再実行コマンド

リポジトリルートで次を実行します。

```powershell
@'
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const dir = path.resolve('public/assets/backgrounds/midground');
const exts = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const files = fs.readdirSync(dir).filter((name) => exts.has(path.extname(name).toLowerCase())).sort();

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { encoding: opts.encoding ?? 'utf8', maxBuffer: opts.maxBuffer ?? 1024 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  }
  return result;
}

function probe(file) {
  const result = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', file]);
  return JSON.parse(result.stdout).streams[0];
}

function readRgba(file) {
  const result = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], {
    encoding: 'buffer',
    maxBuffer: 1024 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`ffmpeg decode failed for ${file}\n${result.stderr.toString('utf8')}`);
  }
  return result.stdout;
}

function findBottomContentY(buffer, width, height) {
  const alphaThreshold = 8;
  for (let y = height - 1; y >= 0; y--) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (buffer[row + x * 4 + 3] > alphaThreshold) return y;
    }
  }
  return height - 1;
}

const summaries = [];
for (const name of files) {
  const input = path.join(dir, name);
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, ext);
  const output = path.join(dir, `${base}.webp`);
  const temp = path.join(dir, `${base}.normalized.tmp.webp`);
  const { width, height } = probe(input);
  const rgba = readRgba(input);
  const bottomY = findBottomContentY(rgba, width, height);
  const cropHeight = bottomY + 1;
  const filter = `crop=iw:${cropHeight}:0:0,scale=-2:720:flags=lanczos`;

  run('ffmpeg', [
    '-y', '-v', 'error', '-i', input,
    '-vf', filter,
    '-frames:v', '1',
    '-c:v', 'libwebp',
    '-quality', '92',
    '-compression_level', '6',
    '-preset', 'picture',
    temp,
  ]);

  if (fs.existsSync(output)) fs.rmSync(output);
  fs.renameSync(temp, output);
  if (ext !== '.webp') fs.rmSync(input);

  const after = probe(output);
  summaries.push({ file: path.basename(output), before: `${width}x${height}`, cropBottomPx: height - cropHeight, after: `${after.width}x${after.height}` });
}

console.table(summaries);
'@ | node -
```

## 実行後の確認

```powershell
Get-ChildItem -LiteralPath public/assets/backgrounds/midground -File | Select-Object Name,Length
npm run build
```

