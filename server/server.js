const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Socket server is running");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// ─── Questions & traits ───────────────────────────────────────────────────────

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
    text: "تصور کن در یک شرکت بزرگ کار می‌کنی و متوجه می‌شوی همکارت ایده تو را دزدیده. چه کار می‌کنی؟",
    options: [
      { label: "الف", text: "مستقیم و بدون ترس حقیقت را جلوی همه مطرح می‌کنم.", traits: ["courage", "decisiveness"] },
      { label: "ب", text: "آرام مدرک جمع می‌کنم تا در زمان مناسب ثابتش کنم.", traits: ["logic", "discipline"] },
      { label: "ج", text: "سکوت می‌کنم اما از آن به عنوان انگیزه‌ای برای قوی‌تر شدن استفاده می‌کنم.", traits: ["emotional-control", "ambition"] },
      { label: "د", text: "اول سعی می‌کنم بفهمم چرا چنین کاری کرده و با خودش صحبت کنم.", traits: ["empathy", "adaptability"] },
    ],
  },
  {
    id: 4,
    text: "در یک تعطیلات طولانی ترجیح می‌دهی بیشتر وقتت را چگونه بگذرانی؟",
    options: [
      { label: "الف", text: "آشنا شدن با آدم‌های جدید", traits: ["sociability", "adaptability"] },
      { label: "ب", text: "یاد گرفتن مهارت یا دانشی تازه", traits: ["curiosity", "discipline"] },
      { label: "ج", text: "استراحت و دور شدن از شلوغی", traits: ["emotional-control", "patience"] },
      { label: "د", text: "انجام کارهای هیجان‌انگیز و غیرمنتظره", traits: ["adventurousness", "courage"] },
    ],
  },
  {
    id: 5,
    text: "اگر وارد یک کتابخانه بسیار قدیمی شوی، اول دنبال چه می‌گردی؟",
    options: [
      { label: "الف", text: "کتاب‌های ممنوعه و ناشناخته", traits: ["curiosity", "courage"] },
      { label: "ب", text: "نقشه‌ها و اسناد تاریخی", traits: ["logic", "discipline"] },
      { label: "ج", text: "داستان‌ها و افسانه‌های عجیب", traits: ["creativity", "intuition"] },
      { label: "د", text: "بخشی که مردم دور هم جمع شده‌اند و بحث می‌کنند", traits: ["sociability", "leadership"] },
    ],
  },
  {
    id: 6,
    text: "اگر بتوانی فقط یک ویژگی را در خودت قوی‌تر کنی، کدام را انتخاب می‌کنی؟",
    options: [
      { label: "الف", text: "شجاعت برای انجام کارهای بزرگ", traits: ["courage", "ambition"] },
      { label: "ب", text: "آرامش ذهن در شرایط سخت", traits: ["emotional-control", "patience"] },
      { label: "ج", text: "توانایی فهم آدم‌ها", traits: ["empathy", "sociability"] },
      { label: "د", text: "ذهنی خلاق برای ساخت چیزهای جدید", traits: ["creativity", "curiosity"] },
    ],
  },
  {
    id: 7,
    text: "ساعتی پیدا می‌کنی که می‌تواند زمان را به عقب برگرداند، اما هر بار ده سال از عمرت کم می‌کند. چه می‌کنی؟",
    options: [
      { label: "الف", text: "از آن برای موفقیت استفاده می‌کنم.", traits: ["ambition", "decisiveness"] },
      { label: "ب", text: "فقط برای نجات دیگران استفاده می‌کنم.", traits: ["empathy", "responsibility"] },
      { label: "ج", text: "اصلاً لمسش نمی‌کنم.", traits: ["discipline", "emotional-control"] },
      { label: "د", text: "مدام آزمایشش می‌کنم تا محدودیتش را بفهمم.", traits: ["curiosity", "adventurousness"] },
    ],
  },
  {
    id: 8,
    text: "بهترین دوستت اشتباه بزرگی کرده که پنهان کردنش به یک بی‌گناه آسیب می‌زند. چه می‌کنی؟",
    options: [
      { label: "الف", text: "حقیقت را می‌گویم، حتی اگر دوستم را از دست بدهم.", traits: ["responsibility", "idealism"] },
      { label: "ب", text: "از دوستم می‌خواهم خودش حقیقت را اعتراف کند و کنارش می‌مانم.", traits: ["loyalty", "leadership"] },
      { label: "ج", text: "سعی می‌کنم راه‌حلی پیدا کنم که کمترین آسیب را به همه بزند.", traits: ["creativity", "empathy"] },
      { label: "د", text: "تا زمانی که مطمئن نشوم چه کسی واقعاً مقصر است، تصمیم نمی‌گیرم.", traits: ["patience", "logic"] },
    ],
  },
  {
    id: 9,
    text: "فقط یک سفینه برای ترک زمین باقی مانده و ظرفیتش محدود است. چه می‌کنی؟",
    options: [
      { label: "الف", text: "خانواده و دوستانم را نجات می‌دهم.", traits: ["loyalty", "empathy"] },
      { label: "ب", text: "دانشمندان و افراد مفید را انتخاب می‌کنم.", traits: ["logic", "responsibility"] },
      { label: "ج", text: "برای گرفتن جایگاه می‌جنگم.", traits: ["competitiveness", "ambition"] },
      { label: "د", text: "می‌مانم تا به دیگران کمک کنم.", traits: ["idealism", "leadership"] },
    ],
  },
  {
    id: 10,
    text: "اگر یک روز با یک قدرت ماورایی از خواب بیدار شوی، دوست داری صاحب چه قدرتی باشی؟",
    options: [
      { label: "الف", text: "توانایی دیدن آینده و اتفاقاتی که هنوز رخ نداده‌اند.", traits: ["intuition", "decisiveness"] },
      { label: "ب", text: "توانایی کنترل ذهن و متقاعد کردن دیگران فقط با چند جمله.", traits: ["leadership", "ambition"] },
      { label: "ج", text: "توانایی سفر آزادانه به هر نقطه از جهان در یک لحظه.", traits: ["independence", "adventurousness"] },
      { label: "د", text: "بتوانی هر زمان که بخواهی کاملاً ناپدید شوی.", traits: ["independence", "emotional-control"] },
    ],
  },
];

const TRAIT_LABELS = {
  leadership: "رهبری",
  ambition: "جاه‌طلبی",
  creativity: "خلاقیت",
  curiosity: "کنجکاوی",
  empathy: "همدلی",
  sociability: "اجتماعی بودن",
  adventurousness: "ماجراجویی",
  independence: "استقلال",
  intuition: "شهود",
  "emotional-control": "کنترل احساسات",
  patience: "صبر",
  courage: "شجاعت",
  decisiveness: "قدرت تصمیم‌گیری",
  logic: "منطق",
  discipline: "نظم و انضباط",
  adaptability: "انعطاف‌پذیری",
  responsibility: "مسئولیت‌پذیری",
  loyalty: "وفاداری",
  idealism: "آرمان‌گرایی",
  competitiveness: "رقابت‌طلبی",
};

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

function computeTraits(subjectId) {
  const totals = {};
  Object.entries(answers[subjectId] || {}).forEach(([qIdStr, votes]) => {
    const qId = parseInt(qIdStr);
    const question = QUESTIONS.find((q) => q.id === qId);
    if (!question) return;
    votes.forEach(({ optionIndex }) => {
      const option = question.options[optionIndex];
      if (!option) return;
      option.traits.forEach((slug) => {
        totals[slug] = (totals[slug] || 0) + POINTS_PER_TRAIT;
      });
    });
  });
  return Object.entries(totals)
    .map(([slug, points]) => ({ slug, label: TRAIT_LABELS[slug] || slug, points }))
    .sort((a, b) => b.points - a.points);
}

function endRound() {
  const subjectId = subjectQueue[currentSubjectIndex];
  io.emit("roundResult", {
    subjectId,
    subjectName: players[subjectId]?.name ?? "???",
    traits: computeTraits(subjectId),
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

  // Any player can advance to next round after seeing results
  socket.on("nextRound", () => {
    currentSubjectIndex += 1;
    if (currentSubjectIndex >= subjectQueue.length) {
      const summary = subjectQueue.map((id) => ({
        playerId: id,
        playerName: players[id]?.name ?? "???",
        traits: computeTraits(id),
      }));
      io.emit("gameOver", { summary });
      gameActive = false;
    } else {
      startRound();
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
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Running on ${PORT}`);
});