document.addEventListener("DOMContentLoaded", () => {
  const ventText = document.getElementById("ventText");
  const saveBtn = document.getElementById("saveVent");
  const ventEntries = document.getElementById("ventEntries");
  const searchBar = document.getElementById("searchBar");
  const toggle = document.getElementById("darkModeToggle");

  let vents = JSON.parse(localStorage.getItem("vents")) || [];

  // Check dark mode saved state
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    toggle.checked = true;
  }

  // Render vents
  function renderVents(filter = "") {
    ventEntries.innerHTML = "";
    vents
      .filter(entry => entry.text.toLowerCase().includes(filter.toLowerCase()))
      .forEach((entry, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <small>${new Date(entry.date).toLocaleString()}</small>
          <p>${entry.text}</p>
          <div class="vent-actions">
            <button onclick="editVent(${index})">✏️</button>
            <button onclick="deleteVent(${index})">🗑</button>
          </div>
        `;
        ventEntries.prepend(li);
      });
  }

  renderVents();

  // Save new vent
  saveBtn.addEventListener("click", () => {
    const text = ventText.value.trim();
    if (!text) return;

    vents.push({ text, date: new Date().toISOString() });
    localStorage.setItem("vents", JSON.stringify(vents));

    ventText.value = "";
    renderVents();
  });

  // Search vents
  searchBar.addEventListener("input", () => {
    renderVents(searchBar.value);
  });

  // Dark mode toggle
  toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark", toggle.checked);
    localStorage.setItem("darkMode", toggle.checked);
  });

  // Expose edit/delete functions globally
  window.editVent = (index) => {
    const newText = prompt("Edit your vent:", vents[index].text);
    if (newText !== null && newText.trim() !== "") {
      vents[index].text = newText.trim();
      localStorage.setItem("vents", JSON.stringify(vents));
      renderVents();
    }
  };

  window.deleteVent = (index) => {
    if (confirm("Delete this entry?")) {
      vents.splice(index, 1);
      localStorage.setItem("vents", JSON.stringify(vents));
      renderVents();
    }
  };
});