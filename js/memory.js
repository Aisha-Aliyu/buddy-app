const emojis = ["🌸", "🐱", "🍩", "🎈", "🧸", "🍀"];
let cards = [...emojis, ...emojis]; // 6 pairs
let flippedCards = [];
let matchedPairs = 0;
let attempts = 0;
let timerInterval;
let seconds = 0;

function shuffleCards(array) {
  return array.sort(() => Math.random() - 0.5);
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function startTimer() {
  seconds = 0;
  document.getElementById("timer").textContent = "00:00";
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = formatTime(seconds);
  }, 1000);
}

function startMemoryGame() {
  const grid = document.getElementById("cardGrid");
  const popup = document.getElementById("memoryCompletePopup");
  popup.classList.remove("show");
  grid.innerHTML = "";
  flippedCards = [];
  matchedPairs = 0;
  attempts = 0;
  document.getElementById("attempts").textContent = attempts;

  startTimer();
  loadBestScore();

  const shuffled = shuffleCards(cards);

  shuffled.forEach((symbol, index) => {
    const card = document.createElement("div");
    card.classList.add("memory-card");
    card.setAttribute("data-symbol", symbol);
    card.setAttribute("data-id", index);
    card.textContent = "";
    card.addEventListener("click", flipCard);
    grid.appendChild(card);
  });
}

function flipCard(e) {
  const card = e.currentTarget;
  if (card.classList.contains("flipped") || card.classList.contains("matched") || flippedCards.length >= 2) return;

  card.classList.add("flipped");
  card.textContent = card.getAttribute("data-symbol");
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    attempts++;
    document.getElementById("attempts").textContent = attempts;

    const [first, second] = flippedCards;
    const isMatch = first.getAttribute("data-symbol") === second.getAttribute("data-symbol");

    if (isMatch) {
      first.classList.add("matched");
      second.classList.add("matched");
      matchedPairs++;

      if (matchedPairs === emojis.length) {
        clearInterval(timerInterval);
        setTimeout(() => {
          document.getElementById("finalAttempts").textContent = attempts;
          document.getElementById("finalTime").textContent = formatTime(seconds);
          document.getElementById("memoryCompletePopup").classList.add("show");
          saveBestScore();
        }, 600);
      }

      flippedCards = [];
    } else {
      setTimeout(() => {
        first.classList.remove("flipped");
        second.classList.remove("flipped");
        first.textContent = "";
        second.textContent = "";
        flippedCards = [];
      }, 800);
    }
  }
}

function loadBestScore() {
  const best = localStorage.getItem("memoryBest");
  document.getElementById("bestScore").textContent = best || "--";
}

function saveBestScore() {
  const best = parseInt(localStorage.getItem("memoryBest")) || Infinity;
  if (attempts < best) {
    localStorage.setItem("memoryBest", attempts);
    loadBestScore();
  }
}

window.onload = startMemoryGame;