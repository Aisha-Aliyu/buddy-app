const quotes = [
  { text: "Your current situation is not your final destination.", author: "Unknown" },
  { text: "You are stronger than your struggles.", author: "Aisha" },
  { text: "Every day is a second chance.", author: "Oprah Winfrey" },
  { text: "Stars can’t shine without darkness.", author: "D.H. Sidebottom" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
];

const stories = [
  {
    name: "Fatima from Kano",
    story: "I was stuck in depression, but learning to code and joining a support group changed my life."
  },
  {
    name: "Ibrahim from Nigeria",
    story: "I lost my job during the pandemic. Now, I help others start their tech careers!"
  },
  {
    name: "Aisha",
    story: "From being told girls shouldn't code to becoming a software engineer and photographer — I did it, and so can you."
  }
];

function generateQuote() {
  const quoteBox = document.getElementById("quoteBox");
  const quoteText = quoteBox.querySelector(".quote-text");
  const quoteAuthor = quoteBox.querySelector(".quote-author");

  const random = quotes[Math.floor(Math.random() * quotes.length)];
  quoteText.textContent = `${random.text}`;
  quoteAuthor.textContent = `– ${random.author}`;
}

function loadStories() {
  const list = document.getElementById("storyList");
  stories.forEach(s => {
    const div = document.createElement("div");
    div.className = "story";
    div.innerHTML = `<p>${s.story}</p><div class="name">– ${s.name}</div>`;
    list.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  generateQuote();
  loadStories();
});