const startButton = document.getElementById("startBreath");
const circle = document.querySelector(".circle");
const breathText = document.getElementById("breathText");
const sound = document.getElementById("breatheSound");

const phases = [
  { text: "Inhale...", animation: "breatheIn", duration: 4000 },
  { text: "Hold...", animation: "", duration: 2000 },
  { text: "Exhale...", animation: "breatheOut", duration: 6000 }
];

let phaseIndex = 0;
let breathingInterval;
let isBreathing = false;
let cycleCount = 0;

const quotes = [
  "You are stronger than your stress 💪🏽",
  "Peace starts with your breath 🌬️",
  "Breathe in calm, breathe out tension 💜",
  "You are in control 🧘🏽‍♀️",
  "Let go of what you can’t control 🍃",
  "Your breath is your superpower ✨"
];

// Get saved breathing count
function getSavedBreathStats() {
  return parseInt(localStorage.getItem("breathingCycles") || "0");
}

// Save breathing count
function saveBreathStats(count) {
  const total = getSavedBreathStats() + count;
  localStorage.setItem("breathingCycles", total.toString());
}

function getBadgeTitle(total) {
  if (total >= 31) return "Zen Master 🧘🏽‍♀️";
  if (total >= 16) return "Mindful Pro 🌼";
  if (total >= 6) return "Calm Explorer 🌊";
  return "Beginner Breather 🌱";
}

function updateBreathing() {
  const current = phases[phaseIndex];

  // Show text
  breathText.textContent = current.text;

  // Reset animation
  circle.style.animation = "none";
  void circle.offsetWidth;

  // Apply animation if available
  if (current.animation) {
    circle.style.animation = `${current.animation} ${current.duration}ms ease-in-out forwards`;
  }

  // Move to next phase
  phaseIndex++;

  // If one full cycle is done
  if (phaseIndex >= phases.length) {
    phaseIndex = 0;
    cycleCount++;

    // Show motivational quote every 3 cycles
    if (cycleCount % 3 === 0) {
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      breathText.textContent = `Cycle ${cycleCount} ✓\n"${quote}"`;
    } else {
      breathText.textContent += `  •  Cycle: ${cycleCount}`;
    }
  }

  breathingInterval = setTimeout(updateBreathing, current.duration);
}

function startBreathing() {
  isBreathing = true;
  cycleCount = 0;
  phaseIndex = 0;
  startButton.textContent = "Stop";
  sound.play().catch(() => {
    console.log("Autoplay blocked, will start after interaction");
  });
  updateBreathing();
}

function stopBreathing() {
  isBreathing = false;
  clearTimeout(breathingInterval);
  saveBreathStats(cycleCount);
  showBadge(); // ⬅️ Show badge after stopping

  circle.style.animation = "none";
  breathText.textContent = "Click Start";
  startButton.textContent = "Start";
  sound.pause();
  sound.currentTime = 0;
}

startButton.addEventListener("click", () => {
  if (isBreathing) {
    stopBreathing();
  } else {
    startBreathing();
  }
});


function showBadge() {
  const badgeDiv = document.createElement("div");
  badgeDiv.className = "badge-popup";

  const total = getSavedBreathStats();
  const badge = getBadgeTitle(total);

  badgeDiv.textContent = `🏅 Your Badge: ${badge}`;
  document.body.appendChild(badgeDiv);

  setTimeout(() => {
    badgeDiv.classList.add("show");
    setTimeout(() => badgeDiv.remove(), 4000);
  }, 500);
}