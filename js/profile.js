document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("darkModeToggle");
  const uploadPic = document.getElementById("uploadPic");
  const profilePic = document.getElementById("profilePic");
  const saveBtn = document.getElementById("saveProfile");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const deleteBtn = document.getElementById("deleteAccount");
  const username = document.getElementById("username");
  const bio = document.getElementById("bio");

  // 🌙 Dark mode
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    toggle.checked = true;
  }

  toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark", toggle.checked);
    localStorage.setItem("darkMode", toggle.checked);
  });

  // 📸 Upload profile picture
  uploadPic.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        profilePic.src = e.target.result;
        localStorage.setItem("profilePic", e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  if (localStorage.getItem("profilePic")) {
    profilePic.src = localStorage.getItem("profilePic");
  }

  // 👤 Username + Bio
  if (localStorage.getItem("profileName")) {
    username.textContent = localStorage.getItem("profileName");
  }
  if (localStorage.getItem("profileBio")) {
    bio.value = localStorage.getItem("profileBio");
  }

  username.addEventListener("input", () => {
    localStorage.setItem("profileName", username.textContent.trim());
  });

  bio.addEventListener("input", () => {
    localStorage.setItem("profileBio", bio.value.trim());
    bio.style.height = "auto"; // auto-grow
    bio.style.height = bio.scrollHeight + "px";
  });

  // 📧 Save email + password
  saveBtn.addEventListener("click", () => {
    localStorage.setItem("profileEmail", emailInput.value);
    localStorage.setItem("profilePassword", passwordInput.value);
    alert("Profile updated!");
  });

  if (localStorage.getItem("profileEmail")) {
    emailInput.value = localStorage.getItem("profileEmail");
  }

  // ⚠️ Delete account
  deleteBtn.addEventListener("click", () => {
    const confirmDelete = confirm("⚠️ Are you sure you want to delete your account? This action is irreversible.");
    if (confirmDelete) {
      localStorage.clear();
      alert("Your account has been deleted.");
      window.location.href = "homepage.html";
    }
  });
});