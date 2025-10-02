// Background Music on Homepage
window.addEventListener("DOMContentLoaded", () => {
  const audio = new Audio("assets/audio/background.mp3");
  audio.volume = 0.2;
  audio.loop = true;
  audio.play().catch(() => {
    console.log("Background music will play after interaction.");
  });
});

// Splash screen transition
function goToNextScreen() {
  document.querySelector('.splash-container').style.opacity = 0;
  setTimeout(() => {
    window.location.href = 'welcome.html';
  }, 800);
}

// Get Started → Signup
document.addEventListener("DOMContentLoaded", function () {
  const getStartedBtn = document.querySelector(".get-started-btn");
  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", function () {
      window.location.href = "signup.html";
    });
  }

  // Personalized greeting
  const userName = localStorage.getItem("userName") || " User";
  const greetingName = document.getElementById("userGreetingName");
  const modalName = document.getElementById("userNameModal");

  if (greetingName) greetingName.textContent = userName;
  if (modalName) modalName.textContent = userName;

  // Mood Modal logic
  const chooseMoodBtn = document.querySelector(".mode-btn");
  const moodModal = document.getElementById("moodModal");
  const mainContent = document.body;

  if (chooseMoodBtn && moodModal && mainContent) {
    chooseMoodBtn.addEventListener("click", () => {
      moodModal.classList.add("show");
      mainContent.classList.add("dimmed");
    });

    const moodMessages = {
      Happy: `Yay, ${userName}! Keep shining bright today 🌞`,
      Exhausted: `Hey ${userName}, take it easy today. You’ve done enough 💆‍♀️`,
      Angry: `Let it out, ${userName}. I’m here to listen 💢`,
      Lost: `It’s okay to feel lost sometimes, ${userName}. Let’s find our way back 🌱`,
      Joyful: `That’s amazing, ${userName}! Spread the joy 🥰`,
      Calm: `Ahh... I love this calm energy, ${userName} 🌊`,
      Tired: `You deserve rest, ${userName}. Let’s take a breather 💤`,
      Unhappy: `I’m here for you, ${userName}. Let’s talk it out 🫂`,
      Sad: `Sending you virtual hugs, ${userName} 🤗`,
      Neutral: `Feeling balanced is good too, ${userName} ⚖️`,
      Anxious: `Hey ${userName}, let’s take a deep breath together 🧘🏽‍♀️`,
      Excited: `Let’s channel that energy into something awesome, ${userName} 🎉`
    };

    document.querySelectorAll(".mood-item").forEach(item => {
      item.addEventListener("click", () => {
        document.querySelectorAll(".mood-item").forEach(i => {
          i.classList.remove("selected");
          i.classList.add("unselected");
        });

        item.classList.add("selected");
        item.classList.remove("unselected");

        const mood = item.getAttribute("data-mood");
        localStorage.setItem("selectedMood", mood);
        const checkins = JSON.parse(localStorage.getItem("checkins")) || [];
        checkins.push({ mood, date: new Date().toISOString() });
        localStorage.setItem("checkins", JSON.stringify(checkins));

        const displayName = localStorage.getItem("userName") || "User";
        const msg = moodMessages[mood].replace(/User/g, displayName);

        showToast(msg);

        moodModal.classList.remove("show");
        mainContent.classList.remove("dimmed");
      });
    });
  }
});

// Sign-Up
document.getElementById("signup-form")?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("http://localhost:5000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname: name, email, password }),
    });

    const data = await response.json();
    showToast(data.message);

    if (response.ok) {
      localStorage.setItem("userName", name);
      window.location.href = "signin.html";
    }
  } catch (error) {
    showToast("An error occurred. Please try again.");
  }
});

// Sign-In
document.getElementById("login-form")?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("http://localhost:5000/api/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    showToast(data.message);

    if (response.ok) {
      localStorage.setItem("userName", data.name);
      window.location.href = "homepage.html";
    }
  } catch (error) {
    showToast("An error occurred. Please try again.");
  }
});

// Toast Function
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// Page Navigation Shortcuts

function goToAffirmation() {
  window.location.href = "daily-affirmation.html";
}
function goTo(page) {
  window.location.href = page;
}





// Load saved contacts
let contacts = JSON.parse(localStorage.getItem("contacts")) || [];

function displayContacts() {
  const list = document.getElementById("contactList");
  list.innerHTML = "";

  contacts.forEach((c, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${c.name} - ${c.phone}</span>
      <button onclick="removeContact(${index})">❌</button>
    `;
    list.appendChild(li);
  });
}

// Add new contact
document.getElementById("contactForm").addEventListener("submit", e => {
  e.preventDefault();
  if (contacts.length >= 3) {
    alert("You can only add up to 3 contacts.");
    return;
  }

  const name = document.getElementById("contactName").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();

  if (!name || !phone) return;

  contacts.push({ name, phone });
  localStorage.setItem("contacts", JSON.stringify(contacts));
  displayContacts();

  e.target.reset();
});

// Remove contact
function removeContact(index) {
  contacts.splice(index, 1);
  localStorage.setItem("contacts", JSON.stringify(contacts));
  displayContacts();
}

// Distress alert simulation
function sendDistressAlert() {
  if (contacts.length === 0) {
    alert("No emergency contacts set!");
    return;
  }

  contacts.forEach(c => {
    alert(`🚨 Distress Alert sent to ${c.name} at ${c.phone}`);
  });
}

// Dark mode toggle
const toggle = document.getElementById("darkModeToggle");
if (toggle) {
  toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark", toggle.checked);
  });
}

// Initial display
displayContacts();





