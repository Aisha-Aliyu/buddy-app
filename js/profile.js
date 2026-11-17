document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("darkModeToggle");
  const uploadPic = document.getElementById("uploadPic");
  const profilePic = document.getElementById("profilePic");
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

  // Saving the email and password, logging out and deleting the account are handled by
  // js/account.js through Firebase. Until it has loaded, these buttons say why nothing happens.
  for (const button of document.querySelectorAll("#saveProfile, .logout-btn, #deleteAccount")) {
    button.addEventListener("click", () => {
      if (window.buddyAccountReady) return;
      alert(window.buddyAuthFailed
        ? "Sign-in couldn't load. Please check your connection and refresh the page."
        : "Still loading, please try again in a moment.");
    });
  }

});