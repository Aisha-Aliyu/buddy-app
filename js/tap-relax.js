const tapZone = document.getElementById("tapZone");
const tapAudio = document.getElementById("tapAudio");
const toggleBtn = document.getElementById("toggleDark");

const feedbackMessages = [
  "Breathe in peace 🌿",
  "You’re doing great ✨",
  "Stay present 💜",
  "Let go of stress 🌊",
  "Relax and smile 😊"
];

const softColors = ["#fdfbfb", "#f3e7e9", "#e6f7f7", "#fffaf0", "#f0f5ff"];

let score = 0;
let time = 30;
let interval;
let currentCircle = null;
let feedbackTimer;

function startTapRelax() {
  score = 0;
  time = 30;

  tapAudio.currentTime = 0;
  tapAudio.play();

  tapZone.innerHTML = "";
  tapZone.style.background = "#fff";

  clearInterval(interval);
  interval = setInterval(() => {
    time--;
    if (time <= 0) {
      clearInterval(interval);
      tapAudio.pause();
      clearTimeout(feedbackTimer);
      showFinalMessage();
      return;
    }
    spawnCircle();
    randomBackground();
    showFeedback();
  }, 1000);
}

function spawnCircle() {
  if (currentCircle) currentCircle.remove();

  const circle = document.createElement("div");
  circle.className = "circle";
  circle.style.backgroundColor = document.body.classList.contains("dark")
    ? "#ffc6ff"
    : "#6e3e6d"; // darker shade in light mode

  const x = Math.random() * (tapZone.clientWidth - 70);
  const y = Math.random() * (tapZone.clientHeight - 70);
  circle.style.left = `${x}px`;
  circle.style.top = `${y}px`;

  circle.onclick = () => {
    score++;
    circle.remove();
    triggerParticles(x + 35, y + 35);
  };

  currentCircle = circle;
  tapZone.appendChild(circle);

  setTimeout(() => {
    if (circle.parentNode) circle.remove();
  }, 1800);
}

function showFeedback() {
  const existing = document.querySelector(".feedback-msg");
  if (existing) existing.remove();

  const msg = document.createElement("div");
  msg.className = "feedback-msg";
  msg.textContent = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
  tapZone.appendChild(msg);

  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => msg.remove(), 1800);
}

function showFinalMessage() {
  const msg = document.createElement("div");
  msg.className = "feedback-msg";
  msg.textContent = `Time’s up! You tapped ${score} times!`;
  tapZone.appendChild(msg);
  setTimeout(() => msg.remove(), 4000);
}

function triggerParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    const part = document.createElement("div");
    part.className = "particle";
    part.style.left = `${x}px`;
    part.style.top = `${y}px`;
    tapZone.appendChild(part);

    const angle = Math.random() * 2 * Math.PI;
    const radius = 40 + Math.random() * 20;
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;

    part.style.transform = `translate(${dx}px, ${dy}px)`;
    part.style.opacity = "0";

    setTimeout(() => part.remove(), 600);
  }
}

function randomBackground() {
  const color = softColors[Math.floor(Math.random() * softColors.length)];
  if (!document.body.classList.contains("dark")) {
    tapZone.style.background = color;
  } else {
    tapZone.style.background = "#2a2a2a";
  }
}

// Toggle Dark Mode
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("tapRelaxDarkMode", document.body.classList.contains("dark") ? "on" : "off");
  tapZone.style.background = document.body.classList.contains("dark") ? "#2a2a2a" : softColors[0];
});

// Load saved theme
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("tapRelaxDarkMode") === "on") {
    document.body.classList.add("dark");
    tapZone.style.background = "#2a2a2a";
  }
  startTapRelax();
});