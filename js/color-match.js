const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");

let timer;
let time = 30;
let score = 0;
let correctColor = "";
let awardedBadges = JSON.parse(localStorage.getItem("colorGameBadges")) || [];

const colors = ["Red", "Blue", "Green", "Yellow", "Purple", "Orange"];
const colorValues = {
  Red: "#ff4d4d",
  Blue: "#4d79ff",
  Green: "#4dff88",
  Yellow: "#ffff66",
  Purple: "#c299ff",
  Orange: "#ff944d"
};

const colorWord = document.getElementById("colorWord");
const colorOptions = document.getElementById("colorOptions");
const scoreDisplay = document.getElementById("scoreDisplay");
const badgePopup = document.getElementById("badgePopup");
const badgeContent = document.getElementById("badgeContent");
const endPopup = document.getElementById("endPopup");
const finalScore = document.getElementById("finalScore");

function startTimer() {
  clearInterval(timer);
  time = 30;
  document.getElementById("timeLeft").textContent = time;
  timer = setInterval(() => {
    time--;
    document.getElementById("timeLeft").textContent = time;
    if (time <= 0) {
      clearInterval(timer);
      endGame();
    }
  }, 1000);
}

function generateGame() {
  const name = colors[Math.floor(Math.random() * colors.length)];
  const fontColor = colors[Math.floor(Math.random() * colors.length)];
  correctColor = name;
  colorWord.textContent = name;
  colorWord.style.color = colorValues[fontColor];
  colorOptions.innerHTML = "";

  let wrongOptions = colors.filter(c => c !== name).sort(() => 0.5 - Math.random()).slice(0, 3);
  let includeCorrect = Math.random() > 0.3;
  let options = [...wrongOptions];
  if (includeCorrect) {
    options.splice(Math.floor(Math.random() * 4), 0, name);
  }

  options.forEach(color => {
    const btn = document.createElement("button");
    btn.className = "color-btn";
    btn.style.backgroundColor = colorValues[color];
    btn.setAttribute("data-color", color);
    btn.onclick = checkAnswer;
    colorOptions.appendChild(btn);
  });

  const noneBtn = document.createElement("button");
  noneBtn.className = "color-btn";
  noneBtn.textContent = "None";
  noneBtn.style.backgroundColor = "#ccc";
  noneBtn.setAttribute("data-color", "None");
  noneBtn.onclick = checkAnswer;
  colorOptions.appendChild(noneBtn);
}

function checkAnswer(e) {
  const selected = e.target.getAttribute("data-color");
  const options = Array.from(document.querySelectorAll(".color-btn")).map(btn => btn.getAttribute("data-color"));
  const isCorrectPresent = options.includes(correctColor);

  const isCorrect = (selected === correctColor && isCorrectPresent) || (selected === "None" && !isCorrectPresent);

  if (isCorrect) {
    correctSound.play();
    score++;
  } else {
    wrongSound.play();
    score = Math.max(score - 1, 0);
  }

  scoreDisplay.textContent = "Score: " + score;
  updateProgress();
  generateGame();
}

function updateProgress() {
  localStorage.setItem("colorGameScore", score);

  if (score > 0 && score % 10 === 0) {
    showBadge(`🎉 Great job! You've reached ${score} points!`);
  }

  const milestones = [5, 10, 20];
  milestones.forEach((milestone) => {
    if (score >= milestone && !awardedBadges.includes(milestone)) {
      awardedBadges.push(milestone);
      localStorage.setItem("colorGameBadges", JSON.stringify(awardedBadges));
      showBadge(`🏅 You've earned a badge for ${milestone} points!`);
    }
  });
}

function showBadge(message) {
  badgeContent.textContent = message;
  badgePopup.classList.add("show");
  setTimeout(() => {
    badgePopup.classList.remove("show");
  }, 3000);
}

function viewBadges() {
  const badges = awardedBadges.length ? awardedBadges.join(", ") : "None yet";
  alert(`Your Badges: ${badges}`);
}

function resetProgress() {
  localStorage.removeItem("colorGameScore");
  localStorage.removeItem("colorGameBadges");
  score = 0;
  awardedBadges = [];
  scoreDisplay.textContent = "Score: 0";
  showBadge("🔁 Progress Reset!");
}

function endGame() {
  finalScore.textContent = score;
  endPopup.classList.add("show");
}function startGame() {
  score = 0;
  awardedBadges = JSON.parse(localStorage.getItem("colorGameBadges")) || [];
  scoreDisplay.textContent = "Score: 0";
  document.getElementById("timeLeft").textContent = "30";
  endPopup.classList.remove("show");
  generateGame();
  startTimer();
}

// DARK MODE SUPPORT
function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark);
}

window.onload = () => {
  const storedScore = parseInt(localStorage.getItem("colorGameScore"));
  if (!isNaN(storedScore)) {
    score = storedScore;
    scoreDisplay.textContent = "Score: " + score;
  }

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }

  const toggleBtn = document.getElementById("darkModeToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleDarkMode);
  }

  startGame();
};