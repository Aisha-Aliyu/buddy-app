document.addEventListener("DOMContentLoaded", () => {
  const checkinList = document.getElementById("checkinList");
  const emptyState = document.getElementById("emptyCheckins");

  const checkins = JSON.parse(localStorage.getItem("checkins")) || [];

  if (checkins.length === 0) {
    emptyState.style.display = "block";
    return;
  } else {
    emptyState.style.display = "none";
  }

  // Show most recent first
  [...checkins].reverse().forEach(entry => {
    const card = document.createElement("div");
    card.className = "checkin-card";

    const mood = document.createElement("div");
    mood.className = "mood";
    mood.textContent = `Mood: ${entry.mood}`;

    const date = document.createElement("div");
    date.className = "date";
    date.textContent = new Date(entry.date).toLocaleString();

    card.appendChild(mood);
    card.appendChild(date);
    checkinList.appendChild(card);
  });
});