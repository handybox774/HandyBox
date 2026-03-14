const generateBtn = document.getElementById("generateBtn");
const hexCodeDisplay = document.getElementById("color-hex-code");
const colorBox = document.getElementById("colorBox");
const hexInput = document.getElementById("hexInput");

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

// Show a random color immediately when the page loads
window.addEventListener("load", () => {
  updateColorDisplay();
});
