import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://nodejs-production-11bf.up.railway.app");

// screens: "lobby" | "countdown" | "game" | "result" | "gameover"

export default function App() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [screen, setScreen] = useState("lobby");

  const [roundInfo, setRoundInfo] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });

  // { subjectId, subjectName, god, topTraits, roundNumber, totalRounds }
  const [roundResult, setRoundResult] = useState(null);

  // { summary: [{ playerId, playerName, god }] }
  const [gameOverData, setGameOverData] = useState(null);

  // ─── Socket listeners ──────────────────────────────────────────────────────

  useEffect(() => {
    socket.on("playersUpdate", setPlayers);

    socket.on("countdownTick", (value) => {
      setCountdown(value);
      setScreen("countdown");
    });

    socket.on("countdownAbort", () => {
      setCountdown(null);
      setScreen("lobby");
    });

    socket.on("gameStart", () => {
      setScreen("game");
    });

    // ✅ FIX: roundStart now explicitly switches back to "game" screen
    socket.on("roundStart", (info) => {
      setRoundInfo(info);
      setQuestion(null);
      setSelectedOption(null);
      setSubmitted(false);
      setProgress({ answered: 0, total: 0 });
      setRoundResult(null);
      setScreen("game"); // ← this was missing — caused the loop to stop visually
    });

    socket.on("question", (q) => {
      setQuestion(q);
      setSelectedOption(null);
      setSubmitted(false);
      setProgress({ answered: 0, total: 0 });
    });

    socket.on("answerProgress", setProgress);

    socket.on("roundResult", (result) => {
      setRoundResult(result);
      setScreen("result");
    });

    socket.on("gameOver", (data) => {
      setGameOverData(data);
      setScreen("gameover");
    });

    return () => {
      ["playersUpdate","countdownTick","countdownAbort","gameStart",
       "roundStart","question","answerProgress","roundResult","gameOver"]
        .forEach((e) => socket.off(e));
    };
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const joinLobby = () => {
    if (!name.trim()) return;
    socket.emit("joinLobby", name.trim());
    setJoined(true);
  };

  const toggleReady = () => {
    const next = !ready;
    setReady(next);
    socket.emit("setReady", next);
  };

  const submitAnswer = (optionIndex) => {
    if (submitted || !question) return;
    setSelectedOption(optionIndex);
    setSubmitted(true);
    socket.emit("submitAnswer", { questionId: question.id, optionIndex });
  };

  const goNextRound = () => socket.emit("nextRound");

  // ─── Derived ──────────────────────────────────────────────────────────────

  const isSubject = roundInfo?.subjectId === socket.id;
  const readyCount = players.filter((p) => p.ready).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>

      {/* ══ LOBBY — name entry ══════════════════════════════════════════════ */}
      {screen === "lobby" && !joined && (
        <div style={s.card}>
          <h1 style={s.title}>ورود به لابی</h1>
          <input
            style={s.input}
            placeholder="اسمت را بنویس"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinLobby()}
            autoFocus
          />
          <button style={s.btnPrimary} onClick={joinLobby}>ورود</button>
        </div>
      )}

      {/* ══ LOBBY — waiting room ════════════════════════════════════════════ */}
      {screen === "lobby" && joined && (
        <div style={s.card}>
          <h1 style={s.title}>لابی</h1>
          <p style={s.meta}>{readyCount}/{players.length} آماده</p>

          <ul style={s.playerList}>
            {players.map((p) => (
              <li key={p.id} style={s.playerRow}>
                <span style={s.playerName}>
                  {p.name}
                  {p.id === socket.id && <span style={s.youBadge}> (شما)</span>}
                </span>
                <span style={{ ...s.badge, ...(p.ready ? s.badgeOn : s.badgeOff) }}>
                  {p.ready ? "✓ آماده" : "در انتظار"}
                </span>
              </li>
            ))}
          </ul>

          <button
            style={{ ...s.btnReady, ...(ready ? s.btnReadyActive : {}) }}
            onClick={toggleReady}
          >
            {ready ? "✓ آماده‌ام!" : "آماده‌ام"}
          </button>

          <p style={s.hint}>
            {players.length < 2
              ? "منتظر بازیکنان بیشتر…"
              : readyCount < players.length
              ? `منتظر ${players.length - readyCount} نفر دیگر…`
              : "همه آماده‌اند!"}
          </p>
        </div>
      )}

      {/* ══ COUNTDOWN ══════════════════════════════════════════════════════ */}
      {screen === "countdown" && (
        <div style={s.fullCenter}>
          <div style={s.bigNumber}>{countdown === 0 ? "بریم!" : countdown}</div>
          <p style={s.hint}>بازی شروع می‌شود…</p>
        </div>
      )}

      {/* ══ GAME ═══════════════════════════════════════════════════════════ */}
      {screen === "game" && (
        <div style={s.card}>
          {roundInfo && (
            <div style={s.roundBanner}>
              <span style={s.roundLabel}>
                دور {roundInfo.roundNumber} از {roundInfo.totalRounds}
              </span>
              <p style={s.subjectTag}>
                درباره‌ی <strong style={s.accent}>{roundInfo.subjectName}</strong> پاسخ دهید
              </p>
            </div>
          )}

          {/* Subject: waiting screen */}
          {isSubject && (
            <div style={s.fullCenter}>
              <div style={{ fontSize: "3.5rem" }}>👁️</div>
              <p style={s.waitingText}>بقیه دارند درباره‌ی شما پاسخ می‌دهند…</p>
              {question && (
                <p style={s.meta}>
                  سوال {question.questionIndex + 1} از {question.totalQuestions}
                </p>
              )}
              <ProgressBar answered={progress.answered} total={progress.total} />
            </div>
          )}

          {/* Voters: question */}
          {!isSubject && question && (
            <>
              <p style={s.questionMeta}>
                سوال {question.questionIndex + 1} از {question.totalQuestions}
              </p>
              <p style={s.questionText}>{question.text}</p>

              <div style={s.optionList}>
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    style={{
                      ...s.optionBtn,
                      ...(submitted && selectedOption === i ? s.optionSelected : {}),
                      ...(submitted && selectedOption !== i ? s.optionDisabled : {}),
                    }}
                    onClick={() => submitAnswer(i)}
                    disabled={submitted}
                  >
                    <span style={s.optionLabel}>{opt.label}</span>
                    <span style={s.optionText}>{opt.text}</span>
                  </button>
                ))}
              </div>

              {submitted && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
                  <ProgressBar answered={progress.answered} total={progress.total} />
                  <p style={s.hint}>{progress.answered}/{progress.total} نفر پاسخ دادند</p>
                </div>
              )}
            </>
          )}

          {!isSubject && !question && (
            <p style={{ ...s.hint, margin: "3rem 0" }}>در حال بارگذاری سوال…</p>
          )}
        </div>
      )}

      {/* ══ ROUND RESULT — god reveal ═══════════════════════════════════════ */}
      {screen === "result" && roundResult && (
        <GodReveal
          result={roundResult}
          onNext={goNextRound}
        />
      )}

      {/* ══ GAME OVER ══════════════════════════════════════════════════════ */}
      {screen === "gameover" && gameOverData && (
        <GameOver data={gameOverData} myId={socket.id} />
      )}
    </div>
  );
}

// ─── God Reveal screen ────────────────────────────────────────────────────────

function GodReveal({ result, onNext }) {
  const { subjectName, god, topTraits, roundNumber, totalRounds } = result;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={s.godPage}>
      <p style={s.roundLabel}>دور {roundNumber} از {totalRounds}</p>

      <p style={s.godSubtitle}>
        <span style={s.accent}>{subjectName}</span> شبیه این خداست:
      </p>

      {/* God image */}
      <div style={{ ...s.godImageWrap, opacity: revealed ? 1 : 0, transform: revealed ? "scale(1)" : "scale(0.85)" }}>
        <img
          src={god.image}
          alt={god.name}
          style={s.godImage}
        />
      </div>

      <h2 style={s.godName}>{god.name}</h2>
      <p style={s.godDesc}>{god.description}</p>

      {/* Top traits as pills */}
      <div style={s.traitPills}>
        {topTraits.slice(0, 4).map((t) => (
          <span key={t.slug} style={s.pill}>{t.label}</span>
        ))}
      </div>

      <button style={s.btnPrimary} onClick={onNext}>
        {roundNumber < totalRounds ? "دور بعدی ←" : "نتیجه نهایی ←"}
      </button>
    </div>
  );
}

// ─── Game Over screen ─────────────────────────────────────────────────────────

function GameOver({ data, myId }) {
  return (
    <div style={{ ...s.card, maxWidth: 560, gap: "1.5rem" }}>
      <h1 style={s.title}>🎉 پایان بازی</h1>

      {data.summary.map((entry) => (
        <div key={entry.playerId} style={s.summaryBlock}>
          <div style={s.summaryLeft}>
            <img src={entry.god.image} alt={entry.god.name} style={s.summaryImg} />
          </div>
          <div style={s.summaryRight}>
            <p style={s.summaryPlayer}>
              {entry.playerName}
              {entry.playerId === myId && <span style={s.youBadge}> (شما)</span>}
            </p>
            <p style={s.summaryGodName}>{entry.god.name}</p>
            <p style={s.summaryGodDesc}>{entry.god.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ answered, total }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div style={s.progressTrack}>
      <div style={{ ...s.progressFill, width: `${pct}%` }} />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f1117",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#e8eaf0",
    padding: "1.5rem",
    direction: "rtl",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#1a1d2e",
    border: "1px solid #2a2d42",
    borderRadius: 20,
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.25rem",
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #f5c842, #e07b39)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  accent: { color: "#f5c842" },
  meta: { margin: 0, fontSize: "0.8rem", color: "#6b7280" },
  hint: { margin: 0, fontSize: "0.85rem", color: "#6b7280", textAlign: "center" },

  // Lobby
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: 10,
    border: "1px solid #2a2d42",
    background: "#12141f",
    color: "#e8eaf0",
    outline: "none",
    boxSizing: "border-box",
    textAlign: "right",
  },
  btnPrimary: {
    width: "100%",
    padding: "0.85rem",
    fontSize: "1rem",
    fontWeight: 700,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #f5c842, #e07b39)",
    color: "#0f1117",
    cursor: "pointer",
  },
  btnReady: {
    width: "100%",
    padding: "0.85rem",
    fontSize: "1rem",
    fontWeight: 700,
    borderRadius: 10,
    border: "2px solid #f5c842",
    background: "transparent",
    color: "#f5c842",
    cursor: "pointer",
  },
  btnReadyActive: {
    background: "linear-gradient(135deg, #f5c842, #e07b39)",
    color: "#0f1117",
    border: "2px solid transparent",
  },
  playerList: { listStyle: "none", margin: 0, padding: 0, width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" },
  playerRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.65rem 1rem", borderRadius: 10, background: "#12141f", border: "1px solid #24273a",
  },
  playerName: { fontWeight: 600 },
  youBadge: { fontWeight: 400, fontSize: "0.8rem", color: "#6b7280" },
  badge: { fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999 },
  badgeOn: { background: "#f5c84220", color: "#f5c842", border: "1px solid #f5c842" },
  badgeOff: { background: "#ffffff08", color: "#6b7280", border: "1px solid #2a2d42" },

  // Countdown
  fullCenter: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: "1rem", minHeight: "70vh", textAlign: "center", width: "100%",
  },
  bigNumber: {
    fontSize: "10rem", fontWeight: 900, lineHeight: 1,
    background: "linear-gradient(135deg, #f5c842, #e07b39)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },

  // Game
  roundBanner: {
    width: "100%", display: "flex", flexDirection: "column", alignItems: "center",
    gap: "0.2rem", borderBottom: "1px solid #2a2d42", paddingBottom: "1rem",
  },
  roundLabel: { fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 },
  subjectTag: { fontSize: "1rem", color: "#e8eaf0", margin: 0 },
  waitingText: { fontSize: "1.1rem", color: "#94a3b8", textAlign: "center" },
  questionMeta: { margin: 0, fontSize: "0.75rem", color: "#6b7280", alignSelf: "flex-start" },
  questionText: { margin: 0, fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.7, textAlign: "right" },
  optionList: { width: "100%", display: "flex", flexDirection: "column", gap: "0.6rem" },
  optionBtn: {
    display: "flex", alignItems: "flex-start", gap: "0.75rem",
    width: "100%", padding: "0.85rem 1rem", borderRadius: 12,
    border: "1px solid #2a2d42", background: "#12141f", color: "#e8eaf0",
    cursor: "pointer", textAlign: "right", fontSize: "0.95rem",
  },
  optionSelected: { border: "1px solid #f5c842", background: "#1f1a0d" },
  optionDisabled: { opacity: 0.35, cursor: "default" },
  optionLabel: { fontWeight: 700, color: "#f5c842", minWidth: 28, flexShrink: 0 },
  optionText: { lineHeight: 1.5 },
  progressTrack: { width: "100%", height: 6, background: "#24273a", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #f5c842, #e07b39)", borderRadius: 999, transition: "width 0.4s ease" },

  // God reveal
  godPage: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.1rem",
    textAlign: "center",
  },
  godSubtitle: { margin: 0, fontSize: "1.05rem", color: "#94a3b8" },
  godImageWrap: {
    width: 260,
    height: 260,
    borderRadius: "50%",
    overflow: "hidden",
    border: "3px solid #f5c84260",
    boxShadow: "0 0 60px #f5c84230",
    transition: "opacity 0.6s ease, transform 0.6s ease",
    flexShrink: 0,
  },
  godImage: { width: "100%", height: "100%", objectFit: "cover" },
  godName: {
    margin: 0, fontSize: "1.8rem", fontWeight: 800,
    background: "linear-gradient(135deg, #f5c842, #e07b39)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  godDesc: { margin: 0, fontSize: "0.95rem", color: "#94a3b8", lineHeight: 1.7, maxWidth: 360 },
  traitPills: { display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" },
  pill: {
    padding: "0.3rem 0.9rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600,
    background: "#f5c84218", color: "#f5c842", border: "1px solid #f5c84250",
  },

  // Game over
  summaryBlock: {
    width: "100%", display: "flex", alignItems: "center", gap: "1rem",
    borderTop: "1px solid #2a2d42", paddingTop: "1rem",
  },
  summaryLeft: { flexShrink: 0 },
  summaryImg: { width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid #f5c84260" },
  summaryRight: { display: "flex", flexDirection: "column", gap: "0.2rem", textAlign: "right" },
  summaryPlayer: { margin: 0, fontSize: "0.85rem", color: "#6b7280" },
  summaryGodName: {
    margin: 0, fontSize: "1.2rem", fontWeight: 700,
    background: "linear-gradient(135deg, #f5c842, #e07b39)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  summaryGodDesc: { margin: 0, fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.5 },
};