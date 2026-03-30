const generateBtn = document.getElementById("generateBtn");
const hexCodeDisplay = document.getElementById("color-hex-code");
const colorBox = document.getElementById("colorBox");
const hexInput = document.getElementById("hexInput");

const imageUpload = document.getElementById("imageUpload");
const imagePreview = document.getElementById("imagePreview");
const extractBtn = document.getElementById("extractBtn");
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

generateBtn.addEventListener("click", () => {
  updateColorDisplay();
});

hexInput.addEventListener("input", () => {
  const inputColor = hexInput.value.trim();
  if (/^#([0-9A-Fa-f]{6})$/.test(inputColor)) {
    updateColorDisplay(inputColor.toUpperCase());
  }
});

hexCodeDisplay.addEventListener("click", async () => {
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

imageUpload.addEventListener("change", (e) => {
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

extractBtn.addEventListener("click", () => {
  if (!imagePreview.src) {
    alert("Please upload an image first.");
    return;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.src = imagePreview.src;

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorMap = {};

    // Sampling pixels
    for (let i = 0; i < imageData.length; i += 40) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];

      const key = `${r},${g},${b}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }

    const selectedCount = parseInt(colorCountSelect.value, 10);

    const sortedColors = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, selectedCount);

    currentColors = sortedColors.map((entry) => {
      const [r, g, b] = entry[0].split(",").map(Number);
      return {
        hex: rgbToHex(r, g, b),
        rgb: formatRgb(r, g, b)
      };
    });

    displayPalette();
  };
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

copyAllBtn.addEventListener("click", async () => {
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

downloadBtn.addEventListener("click", () => {
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

    ctx.fillStyle = "#ffffff";
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
