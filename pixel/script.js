const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const drawTool = document.getElementById('drawTool');
const eraseTool = document.getElementById('eraseTool');
const fillTool = document.getElementById('fillTool');
const gridSize = document.getElementById('gridSize');
const clearCanvas = document.getElementById('clearCanvas');
const exportImage = document.getElementById('exportImage');

let pixelSize = 10; // Default for 32x32 grid
let gridDimension = 32; // Default grid size
let currentTool = 'draw'; // Default tool
let isDrawing = false;

// Initialize canvas
function initCanvas() {
  pixelSize = canvas.width / gridDimension;
  ctx.imageSmoothingEnabled = false; // Keep pixels sharp
  clearCanvasFunc();
}

// Clear canvas
function clearCanvasFunc() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw grid lines
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= canvas.width; x += pixelSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += pixelSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Get mouse position in grid coordinates
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);
  return { x, y };
}

// Draw a single pixel
function drawPixel(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

// Flood fill algorithm
function floodFill(x, y, fillColor, targetColor) {
  if (x < 0 || x >= gridDimension || y < 0 || y >= gridDimension) return;
  const currentColor = ctx.getImageData(x * pixelSize, y * pixelSize, 1, 1).data;
  const currentHex = rgbToHex(currentColor[0], currentColor[1], currentColor[2]);
  if (currentHex !== targetColor || currentHex === fillColor) return;

  drawPixel(x, y, fillColor);
  floodFill(x + 1, y, fillColor, targetColor);
  floodFill(x - 1, y, fillColor, targetColor);
  floodFill(x, y + 1, fillColor, targetColor);
  floodFill(x, y - 1, fillColor, targetColor);
}

// Convert RGB to Hex
function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Handle mouse down
canvas.addEventListener('mousedown', (e) => {
  const { x, y } = getMousePos(e);
  if (currentTool === 'draw') {
    isDrawing = true;
    drawPixel(x, y, colorPicker.value);
  } else if (currentTool === 'erase') {
    isDrawing = true;
    drawPixel(x, y, '#ffffff');
  } else if (currentTool === 'fill') {
    const targetColor = rgbToHex(...ctx.getImageData(x * pixelSize, y * pixelSize, 1, 1).data);
    floodFill(x, y, colorPicker.value, targetColor);
  }
});

// Handle mouse move
canvas.addEventListener('mousemove', (e) => {
  if (isDrawing && (currentTool === 'draw' || currentTool === 'erase')) {
    const { x, y } = getMousePos(e);
    drawPixel(x, y, currentTool === 'draw' ? colorPicker.value : '#ffffff');
  }
});

// Stop drawing
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseleave', () => isDrawing = false);

// Ctrl key for continuous drawing
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && (currentTool === 'draw' || currentTool === 'erase')) {
    canvas.addEventListener('mousemove', drawOnMove);
  }
});

document.addEventListener('keyup', (e) => {
  if (!e.ctrlKey) {
    canvas.removeEventListener('mousemove', drawOnMove);
  }
});

function drawOnMove(e) {
  const { x, y } = getMousePos(e);
  drawPixel(x, y, currentTool === 'draw' ? colorPicker.value : '#ffffff');
}

// Tool selection
drawTool.addEventListener('click', () => {
  currentTool = 'draw';
  updateToolStyles();
});
eraseTool.addEventListener('click', () => {
  currentTool = 'erase';
  updateToolStyles();
});
fillTool.addEventListener('click', () => {
  currentTool = 'fill';
  updateToolStyles();
});

function updateToolStyles() {
  drawTool.classList.toggle('bg-purple-800', currentTool === 'draw');
  eraseTool.classList.toggle('bg-purple-800', currentTool === 'erase');
  fillTool.classList.toggle('bg-purple-800', currentTool === 'fill');
}

// Grid size change
gridSize.addEventListener('change', () => {
  gridDimension = parseInt(gridSize.value);
  initCanvas();
});

// Clear canvas
clearCanvas.addEventListener('click', clearCanvasFunc);

// Export image
exportImage.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'pixel-art.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// Initialize
initCanvas();
updateToolStyles();