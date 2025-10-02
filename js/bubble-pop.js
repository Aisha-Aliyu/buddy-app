const container = document.getElementById("bubbleContainer");
const timeDisplay = document.getElementById("time");
const scoreDisplay = document.getElementById("score");
const finalScore = document.getElementById("finalScore");
const endScreen = document.getElementById("endScreen");
const popSound = document.getElementById("popSound");
const bgSound = document.getElementById("bgSound");
const themeToggle = document.getElementById("themeToggle");

let score = 0;
let timeLeft = 30;
let timer;
let gameInterval;

function startGame() {
  score = 0;
  timeLeft = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  finalScore.textContent = "0";
  endScreen.classList.remove("show");
  container.innerHTML = "";

  timer = setInterval(() => {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);

  gameInterval = setInterval(spawnBubble, 800);
}

function endGame() {
  clearInterval(timer);
  clearInterval(gameInterval);
  container.innerHTML = "";
  finalScore.textContent = score;
  endScreen.classList.add("show");
}

function spawnBubble() {
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const size = Math.random() * 30 + 30;
  const left = Math.random() * (container.offsetWidth - size);
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${left}px`;

  bubble.addEventListener("click", () => {
    score++;
    scoreDisplay.textContent = score;
    popSound.currentTime = 0;
    popSound.play();
    bubble.remove();
  });

  container.appendChild(bubble);

  setTimeout(() => bubble.remove(), 7000); // auto-remove if not popped
}

// Theme toggle
themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", themeToggle.checked);
});

window.addEventListener("DOMContentLoaded", () => {
  bgSound.volume = 0.2;
  bgSound.play().catch(() => console.log("Sound will start after user interaction."));
  startGame();
});