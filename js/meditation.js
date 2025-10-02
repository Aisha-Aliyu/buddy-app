function toggleAudio(id, btn) {
  const audio = document.getElementById(id);

  // Pause all other audio first
  document.querySelectorAll("audio").forEach((a) => {
    if (a !== audio) {
      a.pause();
      a.currentTime = 0;
      a.nextElementSibling.textContent = "▶";
    }
  });

  if (audio.paused) {
    audio.play();
    btn.textContent = "⏸";
  } else {
    audio.pause();
    btn.textContent = "▶";
  }
}

