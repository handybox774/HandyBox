const generateBtn = document.getElementById("generateBtn");
const hexCodeDisplay = document.getElementById("color-hex-code");
const colorBox = document.getElementById("colorBox");
const hexInput = document.getElementById("hexInput");

const imageUpload = document.getElementById("imageUpload");
const imagePreview = document.getElementById("imagePreview");
const extractBtn = document.getElementById("extractBtn");
const extractVibrantBtn = document.getElementById("extractVibrantBtn");
const paletteContainer = document.getElementById("paletteContainer");
const colorCountSelect = document.getElementById("colorCount");
const copyAllBtn = document.getElementById("copyAllBtn");
const downloadBtn = document.getElementById("downloadPaletteBtn");

let currentColors = [];

/* =========================
   Random Color Generator
========================= */

function getRandomHexColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
      .toUpperCase()
  );
}

function updateColorDisplay(color = getRandomHexColor()) {
  hexCodeDisplay.textContent = color;
  colorBox.style.backgroundColor = color;
  hexInput.value = color;
}

generateBtn?.addEventListener("click", () => {
  updateColorDisplay();
});

hexInput?.addEventListener("input", () => {
  const inputColor = hexInput.value.trim();
  if (/^#([0-9A-Fa-f]{6})$/.test(inputColor)) {
    updateColorDisplay(inputColor.toUpperCase());
  }
});

hexCodeDisplay?.addEventListener("click", async () => {
  try {
    const currentHex = hexCodeDisplay.textContent;
    await navigator.clipboard.writeText(currentHex);
    hexCodeDisplay.textContent = "Copied!";
    setTimeout(() => {
      hexCodeDisplay.textContent = hexInput.value || "#000000";
    }, 1000);
  } catch (err) {
    console.error("Copy failed", err);
  }
});

/* =========================
   Image Palette Generator
========================= */

imageUpload?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreview.style.display = "block";
    paletteContainer.innerHTML = "";
    currentColors = [];
  };
  reader.readAsDataURL(file);
});

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function formatRgb(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

function quantizeColor(value, step = 24) {
  return Math.round(value / step) * step;
}

function clampColor(value) {
  return Math.max(0, Math.min(255, value));
}

function colorDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h, s, l };
}

function isNearWhite(r, g, b, threshold = 240) {
  return r >= threshold && g >= threshold && b >= threshold;
}

function isNearBlack(r, g, b, threshold = 20) {
  return r <= threshold && g <= threshold && b <= threshold;
}

function getProcessedPixels(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const maxSize = 220;
  let width = img.width;
  let height = img.height;

  if (width > height && width > maxSize) {
    height = Math.round((height * maxSize) / width);
    width = maxSize;
  } else if (height > maxSize) {
    width = Math.round((width * maxSize) / height);
    height = maxSize;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  return ctx.getImageData(0, 0, width, height).data;
}

function buildColorBuckets(imageData, options = {}) {
  const {
    quantizeStep = 24,
    skipNearWhite = true,
    skipNearBlack = false,
    sampleStep = 16
  } = options;

  const colorMap = {};

  for (let i = 0; i < imageData.length; i += sampleStep) {
    let r = imageData[i];
    let g = imageData[i + 1];
    let b = imageData[i + 2];
    const a = imageData[i + 3];

    if (a < 180) continue;
    if (skipNearWhite && isNearWhite(r, g, b)) continue;
    if (skipNearBlack && isNearBlack(r, g, b)) continue;

    r = clampColor(quantizeColor(r, quantizeStep));
    g = clampColor(quantizeColor(g, quantizeStep));
    b = clampColor(quantizeColor(b, quantizeStep));

    const key = `${r},${g},${b}`;
    colorMap[key] = (colorMap[key] || 0) + 1;
  }

  return Object.entries(colorMap).map(([key, count]) => {
    const [r, g, b] = key.split(",").map(Number);
    const hsl = rgbToHsl(r, g, b);

    return {
      r,
      g,
      b,
      count,
      h: hsl.h,
      s: hsl.s,
      l: hsl.l
    };
  });
}

function pickDistinctColors(colors, count, minDistance = 42, scoreMode = "dominant") {
  let scored = [...colors];

  if (scoreMode === "dominant") {
    scored.sort((a, b) => b.count - a.count);
  } else if (scoreMode === "vibrant") {
    scored.sort((a, b) => {
      const scoreA = a.count * (0.35 + a.s * 1.4) * (a.l > 0.92 ? 0.2 : 1);
      const scoreB = b.count * (0.35 + b.s * 1.4) * (b.l > 0.92 ? 0.2 : 1);
      return scoreB - scoreA;
    });
  }

  const chosen = [];

  for (const color of scored) {
    const tooSimilar = chosen.some((picked) => colorDistance(color, picked) < minDistance);
    if (!tooSimilar) {
      chosen.push(color);
    }
    if (chosen.length === count) break;
  }

  return chosen;
}

function setCurrentColorsFromChosen(chosen) {
  currentColors = chosen.map((color) => ({
    hex: rgbToHex(color.r, color.g, color.b),
    rgb: formatRgb(color.r, color.g, color.b)
  }));
  displayPalette();
}

function runExtraction(mode = "dominant") {
  if (!imagePreview.src) {
    alert("Please upload an image first.");
    return;
  }

  const img = new Image();
  img.src = imagePreview.src;

  img.onload = () => {
    const imageData = getProcessedPixels(img);
    const selectedCount = parseInt(colorCountSelect.value, 10);

    const buckets = buildColorBuckets(imageData, {
      quantizeStep: mode === "vibrant" ? 20 : 24,
      skipNearWhite: true,
      skipNearBlack: mode === "vibrant",
      sampleStep: 16
    });

    if (!buckets.length) {
      alert("Could not extract colors from this image.");
      return;
    }

    let chosen = pickDistinctColors(
      buckets,
      selectedCount,
      mode === "vibrant" ? 52 : 42,
      mode
    );

    // إذا ما اكتمل العدد، نخفف الشروط شوي
    if (chosen.length < selectedCount) {
      chosen = pickDistinctColors(
        buckets,
        selectedCount,
        mode === "vibrant" ? 36 : 30,
        mode
      );
    }

    setCurrentColorsFromChosen(chosen);
  };
}

extractBtn?.addEventListener("click", () => {
  runExtraction("dominant");
});

extractVibrantBtn?.addEventListener("click", () => {
  runExtraction("vibrant");
});

function displayPalette() {
  paletteContainer.innerHTML = "";

  if (!currentColors.length) return;

  currentColors.forEach((color) => {
    const item = document.createElement("div");
    item.className = "palette-item";

    const swatch = document.createElement("div");
    swatch.className = "palette-swatch";
    swatch.style.backgroundColor = color.hex;

    const hexText = document.createElement("p");
    hexText.className = "palette-code";
    hexText.textContent = color.hex;

    const rgbText = document.createElement("p");
    rgbText.className = "palette-code";
    rgbText.textContent = color.rgb;

    const copyBtn = document.createElement("button");
    copyBtn.className = "mini-copy-btn";
    copyBtn.textContent = "Copy HEX";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(color.hex);
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy HEX";
        }, 1000);
      } catch (err) {
        console.error("Copy failed", err);
      }
    });

    item.appendChild(swatch);
    item.appendChild(hexText);
    item.appendChild(rgbText);
    item.appendChild(copyBtn);

    paletteContainer.appendChild(item);
  });
}

copyAllBtn?.addEventListener("click", async () => {
  if (!currentColors.length) {
    alert("No colors to copy yet.");
    return;
  }

  const allHex = currentColors.map((c) => c.hex).join(", ");

  try {
    await navigator.clipboard.writeText(allHex);
    copyAllBtn.textContent = "Copied!";
    setTimeout(() => {
      copyAllBtn.textContent = "Copy All";
    }, 1000);
  } catch (err) {
    console.error("Copy all failed", err);
  }
});

downloadBtn?.addEventListener("click", () => {
  if (!currentColors.length) {
    alert("No palette to download yet.");
    return;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const blockWidth = 140;
  const height = 120;

  canvas.width = blockWidth * currentColors.length;
  canvas.height = height;

  currentColors.forEach((color, index) => {
    ctx.fillStyle = color.hex;
    ctx.fillRect(index * blockWidth, 0, blockWidth, height);

    const swatchRgb = color.rgb.match(/\d+/g).map(Number);
    const brightness = (swatchRgb[0] * 299 + swatchRgb[1] * 587 + swatchRgb[2] * 114) / 1000;

    ctx.fillStyle = brightness > 160 ? "#222222" : "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.fillText(color.hex, index * blockWidth + 12, height - 18);
  });

  const link = document.createElement("a");
  link.download = "palette.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

/* =========================
   Initial Load
========================= */

window.addEventListener("load", () => {
  updateColorDisplay();
});
