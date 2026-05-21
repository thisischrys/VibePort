const sharp = require('sharp');
const fs = require('fs');

async function processIcon() {
  const inputFile = 'build/icon_transparent.png';
  const outputFile = 'build/icon_transparent_real.png';

  console.log('Loading', inputFile);
  const image = sharp(inputFile);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`Loaded image: ${width}x${height}, channels: ${channels}`);

  // Create a 2D array of visited pixels for BFS
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Helper to check if pixel is background candidate
  // Grayscale and dark
  function isBgCandidate(x, y) {
    const idx = (y * width + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    // Grayscale: max and min differ by at most 15
    // Dark: max value is at most 95
    return (max - min <= 15) && (max <= 95);
  }

  // Push all boundary pixels that are candidates
  for (let x = 0; x < width; x++) {
    if (isBgCandidate(x, 0)) {
      const idx = 0 * width + x;
      visited[idx] = 1;
      queue.push([x, 0]);
    }
    if (isBgCandidate(x, height - 1)) {
      const idx = (height - 1) * width + x;
      visited[idx] = 1;
      queue.push([x, height - 1]);
    }
  }
  for (let y = 1; y < height - 1; y++) {
    if (isBgCandidate(0, y)) {
      const idx = y * width + 0;
      visited[idx] = 1;
      queue.push([0, y]);
    }
    if (isBgCandidate(width - 1, y)) {
      const idx = y * width + (width - 1);
      visited[idx] = 1;
      queue.push([width - 1, y]);
    }
  }

  console.log(`BFS starting queue size: ${queue.length}`);

  // BFS to find all connected background pixels
  let head = 0;
  const dirs = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx] && isBgCandidate(nx, ny)) {
          visited[nIdx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  console.log(`BFS complete. Found ${queue.length} background pixels out of ${width * height}`);

  // Create alpha mask
  const alphaMask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    alphaMask[i] = visited[i] ? 0 : 255;
  }

  // Smooth the alpha mask using a basic box filter to feather edges
  const smoothedMask = new Uint8Array(width * height);
  const radius = 2; // size of feathering

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += alphaMask[ny * width + nx];
            count++;
          }
        }
      }
      smoothedMask[y * width + x] = Math.round(sum / count);
    }
  }

  // Create final RGBA buffer
  const rgbaBuffer = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const destIdx = i * 4;

    rgbaBuffer[destIdx] = data[srcIdx];       // R
    rgbaBuffer[destIdx + 1] = data[srcIdx + 1]; // G
    rgbaBuffer[destIdx + 2] = data[srcIdx + 2]; // B
    rgbaBuffer[destIdx + 3] = smoothedMask[i];  // A
  }

  // Save the result using sharp
  await sharp(rgbaBuffer, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png()
  .toFile(outputFile);

  console.log('Successfully saved transparent PNG to', outputFile);
}

processIcon().catch(console.error);
