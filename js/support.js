const avatars = [
  "assets/support_community/avatar1.avif",
  "assets/support_community/avatar2.jpg",
  "assets/support_community/avatar3.avif",
  "assets/support_community/avatar4.avif",
  "assets/support_community/avatar5.avif",
  "assets/support_community/avatar6.avif"
];

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("thoughtForm");
  const input = document.getElementById("thoughtInput");
  const postList = document.getElementById("postList");

  const mood = localStorage.getItem("selectedMood") || "Unknown";

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    const avatar = avatars[Math.floor(Math.random() * avatars.length)];
    const time = new Date().toLocaleString();

    const postHTML = `
      <div class="post">
        <img src="${avatar}" alt="Anonymous">
        <div class="post-content">
          <p>${text}</p>
          <div class="mood">Mood: ${mood}</div>
          <div class="timestamp">${time}</div>
        </div>
      </div>
    `;

    postList.insertAdjacentHTML("afterbegin", postHTML);
    input.value = "";
  });
});