const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const colorPalette = document.getElementById('colorPalette').children;
const drawTool = document.getElementById('drawTool');
const eraseTool = document.getElementById('eraseTool');
const fillTool = document.getElementById('fillTool');
const undoTool = document.getElementById('undoTool');
const gridToggle = document.getElementById('gridToggle');
const gridSize = document.getElementById('gridSize');
const clearCanvas = document.getElementById('clearCanvas');
const exportImage = document.getElementById('exportImage');
const viewSaved = document.getElementById('viewSaved');
const savedDrawings = document.getElementById('savedDrawings');
const toggleInstructions = document.getElementById('toggleInstructions');
const instructions = document.getElementById('instructions');

let pixelSize = 10; // Default for 32x32 grid
let gridDimension = 32; // Default grid size
let currentTool = 'draw'; // Default tool
let isDrawing = false;
let showGrid = true; // Grid visibility
let undoStack = []; // Store canvas states for undo

// Save canvas state for undo
function saveState() {
  if (undoStack.length >= 10) undoStack.shift();
  undoStack.push(canvas.toDataURL());
}

// Initialize canvas
function initCanvas() {
  pixelSize = canvas.width / gridDimension;
  ctx.imageSmoothingEnabled = false;
  clearCanvasFunc();
  saveState();
}

// Clear canvas
function clearCanvasFunc() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (showGrid) drawGrid();
  saveState();
}

// Draw grid lines
function drawGrid() {
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

// Get mouse/touch position
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);
  const x = Math.floor((clientX - rect.left) / pixelSize);
  const y = Math.floor((clientY - rect.top) / pixelSize);
  return { x, y };
}

// Draw a single pixel
function drawPixel(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

// Flood fill
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

// Handle start (mouse/touch)
function handleStart(e) {
  e.preventDefault();
  const { x, y } = getPos(e);
  saveState();
  if (currentTool === 'draw') {
    isDrawing = true;
    drawPixel(x, y, colorPicker.value);
  } else if (currentTool === 'erase') {
    isDrawing = true;
    drawPixel(x, y, '#ffffff');
  } else if (currentTool === 'fill') {
    const targetColor = rgbToHex(...ctx.getImageData(x * pixelSize, y * pixelSize, 1, 1).data);
    floodFill(x, y, colorPicker.value, targetColor);
    saveState();
  }
}

// Handle move
function handleMove(e) {
  e.preventDefault();
  if (isDrawing && (currentTool === 'draw' || currentTool === 'erase')) {
    const { x, y } = getPos(e);
    drawPixel(x, y, currentTool === 'draw' ? colorPicker.value : '#ffffff');
  }
}

// Handle end
function handleEnd() {
  isDrawing = false;
  if (currentTool !== 'fill') saveState();
}

// Mouse events
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mouseleave', handleEnd);

// Touch events
canvas.addEventListener('touchstart', handleStart);
canvas.addEventListener('touchmove', handleMove);
canvas.addEventListener('touchend', handleEnd);

// Ctrl key for continuous drawing
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && (currentTool === 'draw' || currentTool === 'erase')) {
    canvas.addEventListener('mousemove', drawOnMove);
    canvas.addEventListener('touchmove', drawOnMove);
  }
});

document.addEventListener('keyup', (e) => {
  if (!e.ctrlKey) {
    canvas.removeEventListener('mousemove', drawOnMove);
    canvas.removeEventListener('touchmove', drawOnMove);
  }
});

function drawOnMove(e) {
  e.preventDefault();
  saveState();
  const { x, y } = getPos(e);
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
undoTool.addEventListener('click', () => {
  if (undoStack.length > 1) {
    undoStack.pop(); // Remove current state
    const img = new Image();
    img.src = undoStack[undoStack.length - 1];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      if (showGrid) drawGrid();
    };
  }
});

// Grid toggle
gridToggle.addEventListener('click', () => {
  showGrid = !showGrid;
  gridToggle.textContent = showGrid ? 'Hide Grid' : 'Show Grid';
  const img = new Image();
  img.src = canvas.toDataURL();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    if (showGrid) drawGrid();
  };
});

// Color palette
Array.from(colorPalette).forEach(button => {
  button.addEventListener('click', () => {
    colorPicker.value = button.dataset.color;
  });
});

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
  link.download = `pixel-art-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// View saved drawings
viewSaved.addEventListener('click', async () => {
  savedDrawings.classList.toggle('hidden');
  if (!savedDrawings.classList.contains('hidden')) {
    savedDrawings.innerHTML = '';
    try {
      const dirHandle = await navigator.storage.getDirectory();
      const drawingsDir = await dirHandle.getDirectoryHandle('drawings', { create: true });
      for await (const entry of drawingsDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.png')) {
          const file = await entry.getFile();
          const url = URL.createObjectURL(file);
          const img = document.createElement('img');
          img.src = url;
          img.className = 'saved-drawing';
          img.alt = entry.name;
          savedDrawings.appendChild(img);
        }
      }
    } catch (err) {
      savedDrawings.innerHTML = '<p class="text-red-500">Error accessing drawings folder. Ensure running on a local server.</p>';
    }
  }
});

// Toggle instructions
toggleInstructions.addEventListener('click', () => {
  instructions.classList.toggle('hidden');
  toggleInstructions.textContent = instructions.classList.contains('hidden') ? 'Show Instructions' : 'Hide Instructions';
});

// Update tool styles
function updateToolStyles() {
  drawTool.classList.toggle('bg-purple-800', currentTool === 'draw');
  eraseTool.classList.toggle('bg-purple-800', currentTool === 'erase');
  fillTool.classList.toggle('bg-purple-800', currentTool === 'fill');
}

// Initialize
initCanvas();
updateToolStyles();