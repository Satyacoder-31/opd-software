const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('force-device-scale-factor', '1');

function buildIco(entries) {
  const count = entries.length;
  const headerSize = 6 + 16 * count;
  let offset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entryBuffers = [];
  for (const item of entries) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(item.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    entryBuffers.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...entryBuffers, ...entries.map(e => e.buffer)]);
}

app.whenReady().then(async () => {
  try {
    const svgContent = fs.readFileSync(path.resolve(__dirname, '../public/favicon.svg'), 'utf8');

    // Create a 1024x1024 high-res offscreen rendering window
    const win = new BrowserWindow({
      width: 1024,
      height: 1024,
      useContentSize: true,
      show: false,
      frame: false,
      transparent: true,
      enableLargerThanScreen: true,
      webPreferences: { offscreen: true }
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; overflow: hidden; }
            body { width: 1024px; height: 1024px; background: transparent; }
            svg { width: 1024px; height: 1024px; display: block; }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `;

    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await new Promise(r => setTimeout(r, 600));

    const masterImage = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });
    console.log('Captured master image:', masterImage.getSize());

    const publicDir = path.resolve(__dirname, '../public');

    // 1. Generate 512x512 logo.png and web-app-manifest-512x512.png
    const img512 = masterImage.resize({ width: 512, height: 512, quality: 'best' });
    const buf512 = img512.toPNG();
    fs.writeFileSync(path.join(publicDir, 'logo.png'), buf512);
    fs.writeFileSync(path.join(publicDir, 'web-app-manifest-512x512.png'), buf512);
    console.log('Generated logo.png and web-app-manifest-512x512.png (512x512)');

    // 2. Generate 192x192 web-app-manifest-192x192.png
    const img192 = masterImage.resize({ width: 192, height: 192, quality: 'best' });
    fs.writeFileSync(path.join(publicDir, 'web-app-manifest-192x192.png'), img192.toPNG());
    console.log('Generated web-app-manifest-192x192.png (192x192)');

    // 3. Generate apple-touch-icon.png (180x180)
    const img180 = masterImage.resize({ width: 180, height: 180, quality: 'best' });
    fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), img180.toPNG());
    console.log('Generated apple-touch-icon.png (180x180)');

    // 4. Generate favicon-96x96.png (96x96)
    const img96 = masterImage.resize({ width: 96, height: 96, quality: 'best' });
    fs.writeFileSync(path.join(publicDir, 'favicon-96x96.png'), img96.toPNG());
    console.log('Generated favicon-96x96.png (96x96)');

    // 5. Generate Multi-Resolution Windows ICO (256, 128, 64, 48, 32, 24, 16)
    const icoSizes = [256, 128, 64, 48, 32, 24, 16];
    const icoEntries = icoSizes.map(size => {
      const resized = masterImage.resize({ width: size, height: size, quality: 'best' });
      return {
        width: size,
        height: size,
        buffer: resized.toPNG()
      };
    });

    const icoBuffer = buildIco(icoEntries);
    fs.writeFileSync(path.join(publicDir, 'app-icon.ico'), icoBuffer);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
    console.log('Generated app-icon.ico and favicon.ico with sizes:', icoSizes.join(', '));
    console.log('ICO size:', icoBuffer.length, 'bytes');

    win.destroy();
    app.quit();
  } catch (err) {
    console.error('Failed to generate icons:', err);
    process.exit(1);
  }
});
