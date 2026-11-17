// Sign-up, sign-in, password reset and the account buttons on the profile page, all
// through Firebase Authentication. Each part only runs on the page that has its form.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  verifyBeforeUpdateEmail,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { auth, currentUser, friendlyError } from "./firebase.js";

const MIN_PASSWORD = 8;

// localStorage can throw (full, or blocked by the browser). These saves are only for the
// greeting and old data, so a failure is logged and never undoes a sign-in or sign-out.
function saveLocally(change) {
  try {
    change(localStorage);
  } catch (error) {
    console.warn("Couldn't update this phone's saved data:", error);
  }
}

function setStatus(form, message, kind = "") {
  const status = form.querySelector(".form-status");
  if (!status) return;
  status.textContent = message;
  status.className = "form-status" + (kind ? ` ${kind}` : "");
}

// Disables the form's button and shows what's happening until the work is done
async function whileBusy(form, busyText, work) {
  const button = form.querySelector('button[type="submit"]');
  const label = button.textContent;
  button.disabled = true;
  button.textContent = busyText;
  setStatus(form, "");
  try {
    await work();
  } catch (error) {
    setStatus(form, friendlyError(error), "error");
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

// --- Sign-up ---
const signupForm = document.getElementById("signup-form");
signupForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("fullname").value.trim().replace(/\s+/g, " ");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name) return setStatus(signupForm, "Please enter your name.", "error");
  if (password.length < MIN_PASSWORD) {
    return setStatus(signupForm, `Your password needs at least ${MIN_PASSWORD} characters.`, "error");
  }

  whileBusy(signupForm, "Creating account...", async () => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    saveLocally((storage) => storage.setItem("userName", name));
    // The account exists by now, so a hiccup saving the name shouldn't stop sign-up
    await updateProfile(user, { displayName: name }).catch((error) => console.error("Couldn't save the name:", error?.code));
    setStatus(signupForm, "Account created. Taking you in...", "success");
    setTimeout(() => { window.location.href = "homepage.html"; }, 900);
  });
});

// --- Sign-in ---
const loginForm = document.getElementById("login-form");
loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  whileBusy(loginForm, "Signing in...", async () => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    saveLocally((storage) => storage.setItem("userName", user.displayName || email.split("@")[0]));
    window.location.href = "homepage.html";
  });
});

// --- Forgot password (sign-in page) ---
loginForm?.querySelector(".password-options a")?.addEventListener("click", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  if (!email) return setStatus(loginForm, "Type your email above, then tap Forgot Password again.", "error");
  try {
    await sendPasswordResetEmail(auth, email);
    // Firebase doesn't say whether the email has an account, so neither does this
    setStatus(loginForm, "If that email has an account, a link to reset the password is on its way.", "success");
  } catch (error) {
    setStatus(loginForm, friendlyError(error), "error");
  }
});

// --- Profile page: log out ---
document.querySelector(".logout-btn")?.addEventListener("click", async () => {
  await signOut(auth).catch((error) => console.error("Sign-out failed:", error?.code));
  saveLocally((storage) => storage.removeItem("userName"));
  window.location.href = "signin.html";
});

// --- Profile page: change email or password ---
const saveButton = document.getElementById("saveProfile");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
if (saveButton && emailInput && passwordInput) {
  // Older versions saved the password here in plain text; accounts live in Firebase now
  saveLocally((storage) => storage.removeItem("profilePassword"));
  // Show the account's real email in place of the page's placeholder one
  currentUser().then((user) => {
    if (user && emailInput.value === emailInput.defaultValue) emailInput.value = user.email || "";
  });

  saveButton.addEventListener("click", async () => {
    const user = await currentUser();
    if (!user) return alert("Please sign in first.");
    const newEmail = emailInput.value.trim();
    const newPassword = passwordInput.value;
    if (newPassword && newPassword.length < MIN_PASSWORD) {
      return alert(`Your new password needs at least ${MIN_PASSWORD} characters.`);
    }

    const done = [];
    try {
      if (newPassword) {
        await updatePassword(user, newPassword);
        passwordInput.value = "";
        done.push("Your password has been changed.");
      }
      if (newEmail && newEmail.toLowerCase() !== (user.email || "").toLowerCase()) {
        await verifyBeforeUpdateEmail(user, newEmail);
        done.push(`We sent a link to ${newEmail}. Your email changes once you open it.`);
      }
      alert(done.length ? done.join(" ") : "Nothing to change.");
    } catch (error) {
      alert(done.concat(friendlyError(error)).join(" "));
    }
  });
}

// --- Profile page: delete account ---
document.getElementById("deleteAccount")?.addEventListener("click", async () => {
  const confirmDelete = confirm("⚠️ Are you sure you want to delete your account? This action is irreversible.");
  if (!confirmDelete) return;
  try {
    const user = await currentUser();
    if (!user) return alert("Please sign in first, then delete your account.");
    await deleteUser(user);
  } catch (error) {
    return alert(friendlyError(error));
  }
  saveLocally((storage) => storage.clear());
  alert("Your account has been deleted.");
  window.location.href = "welcome.html";
});

// Lets script.js know the forms are ready (it covers taps that come before this)
window.buddyAccountReady = true;
