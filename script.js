// ===== PAGE ELEMENTS =====
const homePage = document.getElementById("homePage");
const gamePage = document.getElementById("gamePage");
const finalPage = document.getElementById("finalPage");

const startBtn = document.getElementById("startBtn");
const homeBtn = document.getElementById("homeBtn");
const homeBtnFinal = document.getElementById("homeBtnFinal");
const playAgainBtn = document.getElementById("playAgainBtn");

const startSound = document.getElementById("startSound");
const homeSound = document.getElementById("homeSound");
const successSound = document.getElementById("successSound");
const failSound = document.getElementById("failSound");

let current = null;
let offsetX = 0,
  offsetY = 0;
let originalParent = null;
let originalPos = { left: 0, top: 0 };

// Canvas for pixel-perfect checks
const testCanvas = document.createElement("canvas");
const testCtx = testCanvas.getContext("2d");

// ===== STOP ALL SOUNDS BEFORE PLAYING A NEW ONE =====
function stopAllSounds() {
  [startSound, homeSound, successSound, failSound].forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

// ===== PLAY HOME SOUND ON PAGE LOAD =====
document.addEventListener("DOMContentLoaded", () => {
  stopAllSounds();
  homeSound.currentTime = 0;
  homeSound.play().catch(() => {
    console.log("Autoplay prevented by browser. Will play on first interaction.");
  });
});

// ===== START BUTTON =====
startBtn.addEventListener("click", () => {
  homePage.classList.remove("active");
  gamePage.classList.add("active");

  setTimeout(() => {
    stopAllSounds();
    startSound.play().catch(() => {});
  }, 300);
});

// ===== HOME BUTTON FUNCTION =====
function goHome() {
  gamePage.classList.remove("active");
  finalPage?.classList.remove("active");
  homePage.classList.add("active");

  resetGame();

  setTimeout(() => {
    stopAllSounds();
    homeSound.play().catch(() => {});
  }, 300);
}

homeBtn.addEventListener("click", goHome);
homeBtnFinal.addEventListener("click", goHome);

// ===== PLAY AGAIN BUTTON =====
if (playAgainBtn) {
  playAgainBtn.addEventListener("click", goHome);
}

// ===== DRAG AND DROP =====
function initDragEvents() {
  const objects = document.querySelectorAll(".object");
  objects.forEach((img) => {
    img.addEventListener("mousedown", startDrag);
    img.addEventListener("mousemove", onImageMouseMove);
  });
}

const holes = document.querySelectorAll(".hole");

// Pixel-perfect cursor logic
function onImageMouseMove(e) {
  const img = this;
  const rect = img.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  testCanvas.width = img.naturalWidth;
  testCanvas.height = img.naturalHeight;
  testCtx.clearRect(0, 0, testCanvas.width, testCanvas.height);
  testCtx.drawImage(img, 0, 0);

  const scaleX = img.naturalWidth / rect.width;
  const scaleY = img.naturalHeight / rect.height;
  const pixel = testCtx.getImageData(mouseX * scaleX, mouseY * scaleY, 1, 1).data;
  img.style.cursor = pixel[3] === 0 ? "default" : "grab";
}

// ===== START DRAG =====
function startDrag(e) {
  e.preventDefault();
  const img = this;
  const rect = img.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  testCanvas.width = img.naturalWidth;
  testCanvas.height = img.naturalHeight;
  testCtx.clearRect(0, 0, testCanvas.width, testCanvas.height);
  testCtx.drawImage(img, 0, 0);

  const scaleX = img.naturalWidth / rect.width;
  const scaleY = img.naturalHeight / rect.height;
  const pixel = testCtx.getImageData(clickX * scaleX, clickY * scaleY, 1, 1).data;
  if (pixel[3] === 0) return;

  current = img;
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  originalParent = img.parentElement; // 👈 Save slot parent
  originalPos = { left: img.style.left, top: img.style.top };

  // Move to body for dragging
  const rectAbs = img.getBoundingClientRect();
  img.style.position = "absolute";
  img.style.left = rectAbs.left + "px";
  img.style.top = rectAbs.top + "px";
  img.style.zIndex = "1000";
  img.style.pointerEvents = "none";
  document.body.appendChild(img);

  moveAt(e.pageX, e.pageY);
  document.addEventListener("mousemove", moveDrag);
  document.addEventListener("mouseup", endDrag);
}

// ===== MOVE DRAG =====
function moveAt(pageX, pageY) {
  if (!current) return;
  current.style.left = pageX - offsetX + "px";
  current.style.top = pageY - offsetY + "px";
}

function moveDrag(e) {
  moveAt(e.pageX, e.pageY);
  holes.forEach((h) => {
    const holeRect = h.getBoundingClientRect();
    const objRect = current.getBoundingClientRect();
    const overlap =
      objRect.right > holeRect.left &&
      objRect.left < holeRect.right &&
      objRect.bottom > holeRect.top &&
      objRect.top < holeRect.bottom;
    h.classList.toggle("hovered", overlap);
  });
}

// ===== END DRAG =====
function endDrag() {
  if (!current) return;
  current.style.pointerEvents = "auto";

  let placed = false;
  const objRect = current.getBoundingClientRect();

  holes.forEach((h) => {
    const holeRect = h.getBoundingClientRect();
    const overlap =
      objRect.right > holeRect.left &&
      objRect.left < holeRect.right &&
      objRect.bottom > holeRect.top &&
      objRect.top < holeRect.bottom;

    if (overlap) {
      if (h.dataset.shape === current.dataset.target) {
        stopAllSounds();
        successSound.play().catch(() => {});
        current.remove();

        if (document.querySelectorAll(".object").length === 0) {
          gamePage.classList.remove("active");
          finalPage.classList.add("active");
        }
        placed = true;
      } else {
        stopAllSounds();
        failSound.play().catch(() => {});
      }
    }
    h.classList.remove("hovered");
  });

  if (!placed) {
    // 👇 Restore object back to its slot for responsiveness
    current.style.position = "";
    current.style.left = "";
    current.style.top = "";
    current.style.zIndex = "";
    if (originalParent) originalParent.appendChild(current);
  }

  current = null;
  document.removeEventListener("mousemove", moveDrag);
  document.removeEventListener("mouseup", endDrag);
}

// ===== RESET GAME =====
function resetGame() {
  location.reload(); // simplest way to reset all objects
}

// ===== INIT =====
initDragEvents();
