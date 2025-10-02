const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");
let isDrawing = false;
let paths = [];
let currentPath = [];

const brushColorEl = document.getElementById("brushColor");
const brushSizeEl = document.getElementById("brushSize");
const brushTypeEl = document.getElementById("brushType");

// Start Drawing
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentPath = [];

  const rect = canvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
});

canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  if (currentPath.length) {
    paths.push([...currentPath]);
  }
});
canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

// Drawing function
let lastX = 0;
let lastY = 0;

function draw(e) {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const size = brushSizeEl.value;
  const color = brushColorEl.value;
  const type = brushTypeEl.value;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.lineCap = "round";
  ctx.strokeStyle = color;

  if (type === "pencil") {
    ctx.lineWidth = size;
    ctx.globalAlpha = 1;
  } else if (type === "marker") {
    ctx.lineWidth = size * 2;
    ctx.globalAlpha = 0.3;
  } else if (type === "neon") {
    ctx.lineWidth = size * 1.2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.globalAlpha = 1;
  }

  ctx.stroke();
  ctx.shadowBlur = 0;

  currentPath.push({ x, y, size, color, type });

  lastX = x;
  lastY = y;
}

// Undo last stroke
function undoPaint() {
  paths.pop();
  redrawCanvas();
}

// Clear canvas
function clearCanvas() {
  paths = [];
  redrawCanvas();
}

// Redraw from paths
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  paths.forEach(path => {
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const next = path[i + 1] || p;

      ctx.beginPath();
      ctx.strokeStyle = p.color;

      if (p.type === "pencil") {
        ctx.lineWidth = p.size;
        ctx.globalAlpha = 1;
      } else if (p.type === "marker") {
        ctx.lineWidth = p.size * 2;
        ctx.globalAlpha = 0.3;
      } else if (p.type === "neon") {
        ctx.lineWidth = p.size * 1.2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = 1;
      }

      ctx.moveTo(p.x, p.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  });
}

// Save to wall-of-thoughts

function saveDrawing() {
  // Save canvas as image
  const dataURL = canvas.toDataURL("image/png");

  // Save to an array in localStorage
  const savedPaintings = JSON.parse(localStorage.getItem("moodPaintGallery")) || [];
  savedPaintings.push(dataURL);
  localStorage.setItem("moodPaintGallery", JSON.stringify(savedPaintings));

  // Redirect to Wall of Thought page
  window.location.href = "wall-of-thought.html";
}

  // Set audio volume
  const audio = document.getElementById("bgMusic");
  if (audio) {
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }


// Dark Mode Toggle
document.getElementById("themeToggle")?.addEventListener("change", (e) => {
  document.body.classList.toggle("dark", e.target.checked);
});