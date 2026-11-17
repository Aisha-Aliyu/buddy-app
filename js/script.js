// Backend base URL
const API_URL = "https://buddy-app-xi0a.onrender.com";

// The backend is on Render's free plan, which puts it to sleep when nobody has used it
// for a while, and waking it takes up to a minute. Every page pings it as soon as it
// opens, so by the time someone opens the chat it is usually awake.
function wakeServer() {
  fetch(`${API_URL}/api/health`, { cache: "no-store" }).catch(() => {});
}
wakeServer();

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

// --- Sign-up and sign-in ---
// These run in js/account.js through Firebase once it has loaded. A tap before that just
// gets a note here, and the forms have onsubmit="return false" so the browser never puts
// the password in the page address. If Firebase can't load at all, the page says so.
{
  const LOAD_FAILED = "Sign-in couldn't load. Please check your connection and refresh the page.";
  const authForms = document.querySelectorAll("#login-form, #signup-form");
  const showStatus = (form, message) => {
    const status = form.querySelector(".form-status");
    if (!status) return;
    status.textContent = message;
    status.className = "form-status error";
  };
  for (const form of authForms) {
    form.addEventListener("submit", () => {
      if (window.buddyAccountReady) return;
      showStatus(form, window.buddyAuthFailed ? LOAD_FAILED : "Still loading, please try again in a moment.");
    });
  }
  const showLoadFailed = () => authForms.forEach((form) => showStatus(form, LOAD_FAILED));
  if (window.buddyAuthFailed) showLoadFailed();
  else window.addEventListener("buddy-auth-failed", showLoadFailed, { once: true });
}

// Older versions of the profile page saved the password in this browser in plain text.
// Accounts live in Firebase now, so clear it out.
localStorage.removeItem("profilePassword");

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

// --- Emergency contacts (contacts page only) ---
let contacts = JSON.parse(localStorage.getItem("contacts")) || [];

function displayContacts() {
  const list = document.getElementById("contactList");
  if (!list) return;
  list.innerHTML = "";

  contacts.forEach((c, index) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${c.name} - ${c.phone}`;
    const remove = document.createElement("button");
    remove.textContent = "❌";
    remove.addEventListener("click", () => removeContact(index));
    li.append(label, remove);
    list.appendChild(li);
  });
}

// Add new contact
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", e => {
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
}

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

// Dark mode toggle. Kept in its own block: a global `toggle` here clashed with the
// mood-tracking page's own script, which then failed and never drew the mood chart.
{
  const toggle = document.getElementById("darkModeToggle");
  if (toggle) {
    toggle.addEventListener("change", () => {
      document.body.classList.toggle("dark", toggle.checked);
    });
  }
}

// Initial display
displayContacts();
