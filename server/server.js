const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => res.send("Socket server is running"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ─── Questions (4 active) ─────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 1,
    text: "اگر بتوانی صاحب یکی از این مکان‌ها باشی، کدام را انتخاب می‌کنی؟",
    options: [
      { label: "الف", text: "قلعه‌ای بزرگ روی کوهستان", traits: ["leadership", "ambition"] },
      { label: "ب", text: "آزمایشگاهی مخفی پر از اختراعات", traits: ["creativity", "curiosity"] },
      { label: "ج", text: "کافه‌ای دنج که آدم‌ها در آن احساس آرامش می‌کنند", traits: ["empathy", "sociability"] },
      { label: "د", text: "کشتی‌ای که مدام در سفر است", traits: ["adventurousness", "independence"] },
    ],
  },
  {
    id: 2,
    text: "اگر قرار باشد یک هفته کاملاً تنها به سفر بروی، کدام مکان را انتخاب می‌کنی؟",
    options: [
      { label: "الف", text: "کلبه‌ای چوبی وسط جنگل‌های مه‌آلود", traits: ["independence", "intuition"] },
      { label: "ب", text: "شهری بزرگ و پرجنب‌وجوش با موزه‌ها و کافه‌های معروف", traits: ["sociability", "curiosity"] },
      { label: "ج", text: "جزیره‌ای آرام با ساحل خلوت و صدای موج‌ها", traits: ["emotional-control", "patience"] },
      { label: "د", text: "منطقه‌ای ناشناخته و پر از مسیرهای خطرناک برای کشف", traits: ["adventurousness", "courage"] },
    ],
  },
  {
    id: 3,
    text: "در یک تعطیلات طولانی ترجیح می‌دهی بیشتر وقتت را چگونه بگذرانی؟",
    options: [
      { label: "الف", text: "آشنا شدن با آدم‌های جدید", traits: ["sociability", "adaptability"] },
      { label: "ب", text: "یاد گرفتن مهارت یا دانشی تازه", traits: ["curiosity", "discipline"] },
      { label: "ج", text: "استراحت و دور شدن از شلوغی", traits: ["emotional-control", "patience"] },
      { label: "د", text: "انجام کارهای هیجان‌انگیز و غیرمنتظره", traits: ["adventurousness", "courage"] },
    ],
  },
  {
    id: 4,
    text: "اگر بتوانی فقط یک ویژگی را در خودت قوی‌تر کنی، کدام را انتخاب می‌کنی؟",
    options: [
      { label: "الف", text: "شجاعت برای انجام کارهای بزرگ", traits: ["courage", "ambition"] },
      { label: "ب", text: "آرامش ذهن در شرایط سخت", traits: ["emotional-control", "patience"] },
      { label: "ج", text: "توانایی فهم آدم‌ها", traits: ["empathy", "sociability"] },
      { label: "د", text: "ذهنی خلاق برای ساخت چیزهای جدید", traits: ["creativity", "curiosity"] },
    ],
  },
];

const TRAIT_LABELS = {
  leadership: "رهبری", ambition: "جاه‌طلبی", creativity: "خلاقیت",
  curiosity: "کنجکاوی", empathy: "همدلی", sociability: "اجتماعی بودن",
  adventurousness: "ماجراجویی", independence: "استقلال", intuition: "شهود",
  "emotional-control": "کنترل احساسات", patience: "صبر", courage: "شجاعت",
  decisiveness: "قدرت تصمیم‌گیری", logic: "منطق", discipline: "نظم و انضباط",
  adaptability: "انعطاف‌پذیری", responsibility: "مسئولیت‌پذیری",
  loyalty: "وفاداری", idealism: "آرمان‌گرایی", competitiveness: "رقابت‌طلبی",
};

// ─── Gods — each has a ranked list of traits that match it best ───────────────
// Images are referenced by index (0–4), matching the 5 URLs given by the user.
// Update `name` and `description` once you know what each god is.

const GODS = [
  {
    index: 0,
    name: "خدای اول",           // ← replace with real name
    image: "https://iili.io/BptEPCG.md.png",
    description: "توضیح کوتاه درباره این خدا",  // ← replace
    traits: ["leadership", "ambition", "decisiveness", "courage"],
  },
  {
    index: 1,
    name: "خدای دوم",
    image: "https://iili.io/BptEiGf.md.png",
    description: "توضیح کوتاه درباره این خدا",
    traits: ["creativity", "curiosity", "intuition", "independence"],
  },
  {
    index: 2,
    name: "خدای سوم",
    image: "https://iili.io/BptE4Qs.md.png",
    description: "توضیح کوتاه درباره این خدا",
    traits: ["empathy", "sociability", "loyalty", "adaptability"],
  },
  {
    index: 3,
    name: "خدای چهارم",
    image: "https://iili.io/BptEgTX.md.png",
    description: "توضیح کوتاه درباره این خدا",
    traits: ["adventurousness", "courage", "competitiveness", "idealism"],
  },
  {
    index: 4,
    name: "خدای پنجم",
    image: "https://iili.io/BptEQ3l.md.png",
    description: "توضیح کوتاه درباره این خدا",
    traits: ["emotional-control", "patience", "discipline", "responsibility"],
  },
];

// Score each god against the player's trait totals, pick the best match
function pickGod(traitTotals) {
  let bestGod = GODS[0];
  let bestScore = -1;
  for (const god of GODS) {
    const score = god.traits.reduce((sum, t) => sum + (traitTotals[t] || 0), 0);
    if (score > bestScore) { bestScore = score; bestGod = god; }
  }
  return bestGod;
}

const POINTS_PER_TRAIT = 2;

// ─── Runtime state ────────────────────────────────────────────────────────────

const players = {};
let countdownInterval = null;
let countdownValue = 3;

let gameActive = false;
let subjectQueue = [];
let currentSubjectIndex = 0;
let answers = {};
let currentQuestionIndex = 0;
let answeredThisQuestion = new Set();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function broadcastPlayers() {
  io.emit("playersUpdate", Object.values(players));
}

function allReady() {
  const list = Object.values(players);
  return list.length >= 2 && list.every((p) => p.ready);
}

function voterCount() {
  const subjectId = subjectQueue[currentSubjectIndex];
  return Object.keys(players).filter((id) => id !== subjectId).length;
}

function startCountdown() {
  if (countdownInterval) return;
  countdownValue = 3;
  io.emit("countdownTick", countdownValue);
  countdownInterval = setInterval(() => {
    if (!allReady()) { stopCountdown(); return; }
    countdownValue -= 1;
    io.emit("countdownTick", countdownValue);
    if (countdownValue <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      startGame();
    }
  }, 1000);
}

function stopCountdown() {
  if (!countdownInterval) return;
  clearInterval(countdownInterval);
  countdownInterval = null;
  io.emit("countdownAbort");
}

// ─── Game flow ────────────────────────────────────────────────────────────────

function startGame() {
  gameActive = true;
  subjectQueue = Object.keys(players).sort(() => Math.random() - 0.5);
  currentSubjectIndex = 0;
  answers = {};
  subjectQueue.forEach((id) => { answers[id] = {}; });
  io.emit("gameStart");
  startRound();
}

function startRound() {
  currentQuestionIndex = 0;
  answeredThisQuestion = new Set();
  const subjectId = subjectQueue[currentSubjectIndex];
  io.emit("roundStart", {
    subjectId,
    subjectName: players[subjectId]?.name ?? "???",
    roundNumber: currentSubjectIndex + 1,
    totalRounds: subjectQueue.length,
  });
  sendQuestion();
}

function sendQuestion() {
  answeredThisQuestion = new Set();
  const q = QUESTIONS[currentQuestionIndex];
  io.emit("question", {
    questionIndex: currentQuestionIndex,
    totalQuestions: QUESTIONS.length,
    id: q.id,
    text: q.text,
    options: q.options.map((o) => ({ label: o.label, text: o.text })),
  });
}

function computeTraitTotals(subjectId) {
  const totals = {};
  Object.entries(answers[subjectId] || {}).forEach(([qIdStr, votes]) => {
    const question = QUESTIONS.find((q) => q.id === parseInt(qIdStr));
    if (!question) return;
    votes.forEach(({ optionIndex }) => {
      const option = question.options[optionIndex];
      if (!option) return;
      option.traits.forEach((slug) => {
        totals[slug] = (totals[slug] || 0) + POINTS_PER_TRAIT;
      });
    });
  });
  return totals;
}

function endRound() {
  const subjectId = subjectQueue[currentSubjectIndex];
  const traitTotals = computeTraitTotals(subjectId);
  const god = pickGod(traitTotals);

  // Top traits for display (sorted)
  const topTraits = Object.entries(traitTotals)
    .map(([slug, points]) => ({ slug, label: TRAIT_LABELS[slug] || slug, points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  io.emit("roundResult", {
    subjectId,
    subjectName: players[subjectId]?.name ?? "???",
    god,
    topTraits,
    roundNumber: currentSubjectIndex + 1,
    totalRounds: subjectQueue.length,
  });
}

// ─── Socket ───────────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("joinLobby", (name) => {
    players[socket.id] = { id: socket.id, name, ready: false };
    broadcastPlayers();
  });

  socket.on("setReady", (ready) => {
    if (!players[socket.id]) return;
    players[socket.id].ready = ready;
    broadcastPlayers();
    if (allReady()) startCountdown();
    else stopCountdown();
  });

  socket.on("submitAnswer", ({ questionId, optionIndex }) => {
    if (!gameActive) return;
    const subjectId = subjectQueue[currentSubjectIndex];
    if (socket.id === subjectId) return;
    if (answeredThisQuestion.has(socket.id)) return;

    answeredThisQuestion.add(socket.id);
    if (!answers[subjectId][questionId]) answers[subjectId][questionId] = [];
    answers[subjectId][questionId].push({ voterId: socket.id, optionIndex });

    io.emit("answerProgress", {
      answered: answeredThisQuestion.size,
      total: voterCount(),
    });

    if (answeredThisQuestion.size >= voterCount()) {
      currentQuestionIndex += 1;
      if (currentQuestionIndex >= QUESTIONS.length) {
        endRound();
      } else {
        setTimeout(sendQuestion, 800);
      }
    }
  });

  socket.on("nextRound", () => {
    currentSubjectIndex += 1;
    if (currentSubjectIndex >= subjectQueue.length) {
      // All players done — build game-over summary
      const summary = subjectQueue.map((id) => {
        const totals = computeTraitTotals(id);
        return {
          playerId: id,
          playerName: players[id]?.name ?? "???",
          god: pickGod(totals),
        };
      });
      io.emit("gameOver", { summary });
      gameActive = false;
    } else {
      startRound(); // ← this emits "roundStart" which the client now uses to go back to game screen
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    broadcastPlayers();
    if (!allReady()) stopCountdown();
  });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => console.log(`Running on ${PORT}`));