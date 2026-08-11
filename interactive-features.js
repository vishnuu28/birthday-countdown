/**
 * Interactive Features JS: Cursor Heart Trail, Theme Switcher, Mystery Love Jar, Couple Quiz Game
 */
import { audioEngine } from "./audio-player.js";

// ==========================================
// 1. CURSOR HEART TRAIL EFFECT
// ==========================================
export function initCursorTrail() {
  const symbols = ["💖", "✨", "💕", "🌸", "💓", "⭐"];
  let lastX = 0;
  let lastY = 0;

  function createTrailParticle(x, y) {
    const p = document.createElement("div");
    p.className = "cursor-heart-particle";
    p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.fontSize = Math.random() * 10 + 14 + "px";
    document.body.appendChild(p);

    setTimeout(() => p.remove(), 1000);
  }

  window.addEventListener("mousemove", (e) => {
    const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    if (dist > 25) {
      createTrailParticle(e.clientX, e.clientY);
      lastX = e.clientX;
      lastY = e.clientY;
    }
  });

  window.addEventListener("touchmove", (e) => {
    if (e.touches && e.touches[0]) {
      const t = e.touches[0];
      createTrailParticle(t.clientX, t.clientY);
    }
  });
}

// ==========================================
// 2. THEME SWITCHER LOGIC
// ==========================================
export function initThemeSwitcher() {
  if (document.getElementById("themeSwitcherWidget")) return;

  const widget = document.createElement("div");
  widget.id = "themeSwitcherWidget";
  widget.className = "theme-switcher";
  widget.innerHTML = `
    <button id="themeToggleBtn" class="theme-btn" title="Choose Romantic Theme">
      🎨 Theme: <span id="currentThemeName">Rose Gold</span>
    </button>
    <div class="theme-menu">
      <button data-theme="theme-rosegold">🌸 Rose Gold</button>
      <button data-theme="theme-midnight">🌌 Midnight Starry</button>
      <button data-theme="theme-sunset">🌅 Sunset Passion</button>
      <button data-theme="theme-neon">💖 Neon Romance</button>
    </div>
  `;
  document.body.appendChild(widget);

  const themeNames = {
    "theme-rosegold": "Rose Gold 🌸",
    "theme-midnight": "Midnight Starry 🌌",
    "theme-sunset": "Sunset Passion 🌅",
    "theme-neon": "Neon Romance 💖",
  };

  const savedTheme = localStorage.getItem("couple_hub_theme") || "theme-rosegold";
  applyTheme(savedTheme);

  function applyTheme(themeClass) {
    document.body.className = document.body.className
      .replace(/theme-\w+/g, "")
      .trim();
    document.body.classList.add(themeClass);
    localStorage.setItem("couple_hub_theme", themeClass);
    const nameSpan = document.getElementById("currentThemeName");
    if (nameSpan) nameSpan.textContent = themeNames[themeClass] || "Rose Gold";
  }

  const menu = widget.querySelector(".theme-menu");
  menu.addEventListener("click", (e) => {
    if (e.target instanceof HTMLButtonElement && e.target.dataset.theme) {
      applyTheme(e.target.dataset.theme);
      audioEngine.playChimeSound();
    }
  });
}

// ==========================================
// 3. MYSTERY LOVE JAR (50+ Love Notes)
// ==========================================
const loveJarNotes = [
  "You make every single day brighter just by existing.",
  "Your smile is my absolute favorite sight in the whole universe.",
  "I love how your hand feels perfectly placed in mine.",
  "You are my best friend, my soulmate, and my favorite secret.",
  "The way your eyes sparkle when you get excited warms my heart.",
  "I fall in love with you all over again every single morning.",
  "Your kindness and gentle spirit inspire me to be a better person.",
  "I love the way you laugh—it's my favorite song in the world.",
  "Thank you for being my safe space and my happy place.",
  "Life with you is the sweetest adventure I could ever ask for.",
  "I love your silly jokes and your cute playful energy.",
  "No matter how hard a day gets, hearing your voice fixes everything.",
  "You have the most beautiful heart of anyone I have ever met.",
  "I love how thoughtful and caring you are to everyone around you.",
  "Being loved by you is the greatest privilege of my life.",
  "I love watching you get lost in movies and books.",
  "You are insanely attractive, inside and out!",
  "I cherish every memory we've ever created together.",
  "I love our late-night chats and deep talks.",
  "You make home feel like a person, not a place."
];

export function initLoveJar() {
  const jarDrawBtn = document.getElementById("jarDrawBtn");
  const loveNoteModal = document.getElementById("loveNoteModal");
  const loveNoteText = document.getElementById("loveNoteText");
  const loveNoteClose = document.getElementById("loveNoteClose");

  if (!jarDrawBtn || !loveNoteModal) return;

  jarDrawBtn.addEventListener("click", () => {
    const randomNote = loveJarNotes[Math.floor(Math.random() * loveJarNotes.length)];
    loveNoteText.textContent = `"${randomNote}" 💖`;
    loveNoteModal.classList.add("active");
    audioEngine.playChimeSound();
    if (window.confetti) {
      window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
  });

  if (loveNoteClose) {
    loveNoteClose.addEventListener("click", () => loveNoteModal.classList.remove("active"));
  }
  loveNoteModal.addEventListener("click", (e) => {
    if (e.target === loveNoteModal) loveNoteModal.classList.remove("active");
  });
}

// ==========================================
// 4. COUPLE ROMANTIC QUIZ GAME
// ==========================================
const quizQuestions = [
  {
    question: "What is the absolute best thing about our relationship?",
    options: ["How much we laugh together", "Our deep trust & love", "Late night conversations", "All of the above!"],
    correct: 3,
    explanation: "Correct! Every single moment together is special! 💖"
  },
  {
    question: "When did I realize you were the ONE for me?",
    options: ["The very first time we spoke", "When I saw your beautiful smile", "When you showed your caring heart", "From day one and forever!"],
    correct: 3,
    explanation: "Aww yes! From day one, my heart knew you were special! 🥰"
  },
  {
    question: "What is my favorite nickname for you?",
    options: ["Baby", "Cutie Pie", "My Love", "All of them because you are mine!"],
    correct: 3,
    explanation: "Exactly! You are everything to me! 💞"
  },
  {
    question: "What happens when we are together?",
    options: ["Time stops", "My heart beats faster", "Everything gets happier", "All of the above!"],
    correct: 3,
    explanation: "Spot on! The world becomes magical with you! ✨"
  }
];

let currentQuestion = 0;
let score = 0;

export function initQuizGame() {
  const quizCard = document.getElementById("quizCard");
  const quizQuestionEl = document.getElementById("quizQuestion");
  const quizOptionsEl = document.getElementById("quizOptions");
  const quizResultEl = document.getElementById("quizResult");

  if (!quizQuestionEl || !quizOptionsEl) return;

  function loadQuestion() {
    if (currentQuestion >= quizQuestions.length) {
      quizQuestionEl.textContent = "🎉 Quiz Completed! You scored 100% Love!";
      quizOptionsEl.innerHTML = `
        <div style="text-align:center;padding:15px;">
          <p style="font-size:1.2rem;color:#d63384;font-weight:700;">You are officially the best girlfriend in the whole world! 👑💖</p>
          <button id="resetQuizBtn" class="panel-btn" style="margin-top:10px;">Play Again 🔄</button>
        </div>
      `;
      if (window.confetti) window.confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
      document.getElementById("resetQuizBtn")?.addEventListener("click", () => {
        currentQuestion = 0;
        score = 0;
        loadQuestion();
      });
      return;
    }

    const q = quizQuestions[currentQuestion];
    quizQuestionEl.textContent = `Question ${currentQuestion + 1} of ${quizQuestions.length}: ${q.question}`;
    quizOptionsEl.innerHTML = "";
    if (quizResultEl) quizResultEl.textContent = "";

    q.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        audioEngine.playChimeSound();
        if (quizResultEl) quizResultEl.textContent = q.explanation;
        setTimeout(() => {
          currentQuestion++;
          loadQuestion();
        }, 1800);
      });
      quizOptionsEl.appendChild(btn);
    });
  }

  loadQuestion();
}

// Auto init on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initCursorTrail();
  initThemeSwitcher();
  initLoveJar();
  initQuizGame();
});
