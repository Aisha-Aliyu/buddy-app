document.addEventListener("DOMContentLoaded", () => {
  const affirmationList = document.getElementById("affirmationList");
  const toast = document.getElementById("toast");
  const mood = localStorage.getItem("selectedMood") || "Neutral";

  // Affirmations categorized by mood
  const affirmationsByMood = {
    Happy: [
      "Spread your joy with others today 💫",
      "Smile and the world smiles with you 😊",
      "You radiate happiness ✨",
      "Let today be filled with laughter 🎉",
      "Gratitude amplifies joy",
      "You’re glowing from within ☀️",
    ],
    Sad: [
      "It’s okay to feel sad, this too shall pass 💖",
      "You are stronger than your emotions",
      "Take a deep breath, you’re doing well 🫂",
      "Healing takes time. Be patient with yourself",
      "You matter. Always.",
      "Let it out, then let it go 💧"
    ],
    Angry: [
      "Breathe. You control your response 🧘",
      "Pause. Reflect. Respond. 💭",
      "Anger is valid. You are valid 💢",
      "Release the tension, not the connection 🔓",
      "You're learning to handle big emotions 🧠",
      "Calm starts with one breath 🌬️"
    ],
    Anxious: [
      "You are safe right now 🌸",
      "Inhale calm. Exhale stress 🧘‍♀️",
      "Your mind is powerful and can find peace",
      "This feeling will pass. You’ve got this 💪",
      "Let go of what you can’t control",
      "You are capable and strong"
    ],
    Excited: [
      "Use that energy for greatness 🔥",
      "Let’s create something amazing today 💡",
      "Your passion is your power",
      "You’re unstoppable when you believe 🚀",
      "This is your moment! 🌟",
      "Go big. You’re ready!"
    ],
    Calm: [
      "Breathe in peace, breathe out stress 🌿",
      "Your calm is your superpower",
      "Serenity begins with silence",
      "Stillness fuels clarity 💧",
      "You are grounded and balanced 🧘🏽‍♂️",
      "Flow like water, soft yet powerful"
    ],
    Exhausted: [
      "Rest is productive too 😴",
      "You’ve done your best today 💖",
      "Pause. Breathe. Recover.",
      "You deserve to recharge",
      "Rest, don’t quit",
      "Gentle care for a tired soul 🛌"
    ],
    Lost: [
      "Even stars need darkness to shine ✨",
      "You’re not lost, just discovering",
      "Every journey has uncertain roads",
      "Clarity is coming. Keep going 🧭",
      "You’re right where you need to be",
      "New paths begin with confusion"
    ],
    Joyful: [
      "Celebrate your joy 🥳",
      "Your happiness is contagious 💞",
      "Feel it. Love it. Share it",
      "Live fully in this joy",
      "Savor this beautiful moment",
      "Joy looks great on you 🌟"
    ],
    Unhappy: [
      "You are loved, even when you feel low 💗",
      "Your feelings are valid",
      "You are not alone",
      "Better days are ahead",
      "One step at a time 🧩",
      "Let’s talk through it. I’m here"
    ],
    Tired: [
      "Slow down and rest, it’s okay 💤",
      "Energy returns with time",
      "You’re doing more than enough",
      "Prioritize yourself today",
      "Power down to power up ⚡",
      "Rest is self-love 💕"
    ],
    Neutral: [
      "Today is a blank canvas 🖼️",
      "Your balance is beautiful",
      "Even calm has power 🌊",
      "Just be. No pressure 💬",
      "You’re centered and focused",
      "Let the day unfold naturally"
    ]
  };

  // Local backgrounds (replace with your own)
  const backgrounds = [
    "assets/images/bg1.avif",
    "assets/images/bg2.avif",
    "assets/images/bg3.avif",
    "assets/images/bg4.avif",
    "assets/images/bg5.webp",
    "assets/images/bg6.webp",
    "assets/images/bg7.webp",
    "assets/images/bg8.avif",
    "assets/images/bg9.avif",
    "assets/images/bg10.avif"
  ];

  // Shuffle and pick up to 10 affirmations
  const moodAffirmations = affirmationsByMood[mood] || affirmationsByMood["Neutral"];
  const selectedAffirmations = [...moodAffirmations].sort(() => 0.5 - Math.random()).slice(0, 10);

  selectedAffirmations.forEach((quote, index) => {
    const card = document.createElement("div");
    card.className = "affirmation-card";
    card.style.backgroundImage = `url('${backgrounds[index % backgrounds.length]}')`;

    const text = document.createElement("p");
    text.textContent = quote;

    const btns = document.createElement("div");
    btns.className = "card-buttons";

    const saveBtn = document.createElement("span");
    saveBtn.className = "btn-icon";
    saveBtn.innerHTML = "⤓";
    saveBtn.title = "Save to device";
    saveBtn.onclick = () => saveCardAsImage(card);

    const likeBtn = document.createElement("span");
    likeBtn.className = "btn-icon";
    likeBtn.innerHTML = "🤍";
    likeBtn.title = "Add to Favorites";
    likeBtn.onclick = () => {
      saveToFavorites(quote);
      showToast("Saved to favorites 💖");
    };

    btns.appendChild(saveBtn);
    btns.appendChild(likeBtn);

    card.appendChild(text);
    card.appendChild(btns);
    affirmationList.appendChild(card);
  });

  // Save card image to device
  function saveCardAsImage(cardElement) {
    html2canvas(cardElement).then(canvas => {
      const link = document.createElement("a");
      link.download = "affirmation.jpg";
      link.href = canvas.toDataURL("image/jpeg");
      link.click();
      showToast("Image saved ✅");
    });
  }

  // Save affirmation to local favorites
  function saveToFavorites(text) {
    const current = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (!current.includes(text)) {
      current.push(text);
      localStorage.setItem("favorites", JSON.stringify(current));
    }
  }

  // Toast Message
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
});