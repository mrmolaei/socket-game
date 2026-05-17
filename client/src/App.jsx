import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://nodejs-production-11bf.up.railway.app");

// ─── Screens ──────────────────────────────────────────────────────────────────
// "lobby" | "countdown" | "game" | "result" | "gameover"

export default function App() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [screen, setScreen] = useState("lobby");

  // Round info
  const [roundInfo, setRoundInfo] = useState(null);
  // { subjectId, subjectName, roundNumber, totalRounds }

  // Current question
  const [question, setQuestion] = useState(null);
  // { questionIndex, totalQuestions, id, text, options:[{label,text}] }

  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });

  // Round result
  const [roundResult, setRoundResult] = useState(null);
  // { subjectId, subjectName, traits:[{slug,label,points}], roundNumber, totalRounds }

  // Game over
  const [gameOverData, setGameOverData] = useState(null);

  const myIdRef = useRef(socket.id);

  // ─── Socket events ──────────────────────────────────────────────────────────

  useEffect(() => {
    myIdRef.current = socket.id;

    socket.on("playersUpdate", setPlayers);

    socket.on("countdownTick", (value) => {
      setCountdown(value);
      if (value > 0) setScreen("countdown");
    });

    socket.on("countdownAbort", () => {
      setCountdown(null);
      setScreen("lobby");
    });

    socket.on("gameStart", () => {
      setScreen("game");
    });

    socket.on("roundStart", (info) => {
      setRoundInfo(info);
      setQuestion(null);
      setSelectedOption(null);
      setSubmitted(false);
      setProgress({ answered: 0, total: 0 });
    });

    socket.on("question", (q) => {
      setQuestion(q);
      setSelectedOption(null);
      setSubmitted(false);
      setProgress({ answered: 0, total: 0 });
    });

    socket.on("answerProgress", (p) => {
      setProgress(p);
    });

    socket.on("roundResult", (result) => {
      setRoundResult(result);
      setScreen("result");
    });

    socket.on("gameOver", (data) => {
      setGameOverData(data);
      setScreen("gameover");
    });

    return () => {
      socket.off("playersUpdate");
      socket.off("countdownTick");
      socket.off("countdownAbort");
      socket.off("gameStart");
      socket.off("roundStart");
      socket.off("question");
      socket.off("answerProgress");
      socket.off("roundResult");
      socket.off("gameOver");
    };
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const joinLobby = () => {
    if (!name.trim()) return;
    socket.emit("joinLobby", name.trim());
    setJoined(true);
    myIdRef.current = socket.id;
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

  const goNextRound = () => {
    socket.emit("nextRound");
  };

  // ─── Derived ────────────────────────────────────────────────────────────────

  const isSubject = roundInfo?.subjectId === socket.id;
  const readyCount = players.filter((p) => p.ready).length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>

      {/* ══ LOBBY ══════════════════════════════════════════════════════════ */}
      {screen === "lobby" && !joined && (
        <div style={s.card}>
          <h1 style={s.title}>ورود به لابی</h1>
          <input
            style={s.input}
            placeholder="اسمت را بنویس"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinLobby()}
          />
          <button style={s.btnPrimary} onClick={joinLobby}>ورود</button>
        </div>
      )}

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
        <div style={s.centerFull}>
          <div style={s.bigNumber} key={countdown}>
            {countdown === 0 ? "بریم!" : countdown}
          </div>
          <p style={s.hint}>بازی شروع می‌شود…</p>
        </div>
      )}

      {/* ══ GAME ═══════════════════════════════════════════════════════════ */}
      {screen === "game" && (
        <div style={s.card}>
          {/* Round header */}
          {roundInfo && (
            <div style={s.roundBanner}>
              <span style={s.roundLabel}>
                دور {roundInfo.roundNumber} از {roundInfo.totalRounds}
              </span>
              <span style={s.subjectTag}>
                درباره‌ی <strong>{roundInfo.subjectName}</strong> پاسخ دهید
              </span>
            </div>
          )}

          {/* Subject sees a waiting screen */}
          {isSubject && (
            <div style={s.centerFull}>
              <div style={s.waitingIcon}>👁️</div>
              <p style={s.waitingText}>
                بقیه دارند درباره‌ی شما پاسخ می‌دهند…
              </p>
              {question && (
                <p style={s.meta}>
                  سوال {question.questionIndex + 1} از {question.totalQuestions}
                </p>
              )}
              <ProgressBar answered={progress.answered} total={progress.total} />
            </div>
          )}

          {/* Voters see the question */}
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
                <div style={s.waitingOthers}>
                  <ProgressBar answered={progress.answered} total={progress.total} />
                  <p style={s.hint}>
                    {progress.answered}/{progress.total} نفر پاسخ دادند
                  </p>
                </div>
              )}
            </>
          )}

          {/* No question yet (transitioning between questions) */}
          {!isSubject && !question && (
            <p style={{ ...s.hint, marginTop: "3rem" }}>در حال بارگذاری سوال…</p>
          )}
        </div>
      )}

      {/* ══ ROUND RESULT ═══════════════════════════════════════════════════ */}
      {screen === "result" && roundResult && (
        <div style={s.card}>
          <p style={s.roundLabel}>
            دور {roundResult.roundNumber} از {roundResult.totalRounds}
          </p>
          <h2 style={s.resultTitle}>
            ویژگی‌های <span style={s.accent}>{roundResult.subjectName}</span>
            <br />
            <span style={s.resultSub}>از نظر دوستانش</span>
          </h2>

          <TraitBars traits={roundResult.traits} />

          <button style={s.btnPrimary} onClick={goNextRound}>
            {roundResult.roundNumber < roundResult.totalRounds
              ? "دور بعدی →"
              : "نتیجه نهایی →"}
          </button>
        </div>
      )}

      {/* ══ GAME OVER ══════════════════════════════════════════════════════ */}
      {screen === "gameover" && gameOverData && (
        <div style={{ ...s.card, maxWidth: 600 }}>
          <h1 style={s.title}>نتیجه نهایی 🎉</h1>
          {gameOverData.summary.map((entry) => (
            <div key={entry.playerId} style={s.summaryBlock}>
              <h3 style={s.summaryName}>{entry.playerName}</h3>
              <TraitBars traits={entry.traits.slice(0, 5)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ answered, total }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div style={s.progressTrack}>
      <div style={{ ...s.progressFill, width: `${pct}%` }} />
    </div>
  );
}

function TraitBars({ traits }) {
  if (!traits || traits.length === 0) return null;
  const max = traits[0].points;
  return (
    <div style={s.traitList}>
      {traits.map((t) => (
        <div key={t.slug} style={s.traitRow}>
          <span style={s.traitLabel}>{t.label}</span>
          <div style={s.traitTrack}>
            <div
              style={{
                ...s.traitFill,
                width: `${Math.round((t.points / max) * 100)}%`,
              }}
            />
          </div>
          <span style={s.traitPoints}>{t.points}</span>
        </div>
      ))}
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
    position: "relative",
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
    background: "linear-gradient(135deg, #7efff5, #00b4d8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  meta: { margin: 0, fontSize: "0.8rem", color: "#6b7280", letterSpacing: "0.05em" },
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
    background: "#00b4d8",
    color: "#0f1117",
    cursor: "pointer",
  },
  btnReady: {
    width: "100%",
    padding: "0.85rem",
    fontSize: "1rem",
    fontWeight: 700,
    borderRadius: 10,
    border: "2px solid #00b4d8",
    background: "transparent",
    color: "#7efff5",
    cursor: "pointer",
  },
  btnReadyActive: { background: "#00b4d8", color: "#0f1117" },
  hint: { margin: 0, fontSize: "0.85rem", color: "#6b7280", textAlign: "center" },
  playerList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  playerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.65rem 1rem",
    borderRadius: 10,
    background: "#12141f",
    border: "1px solid #24273a",
  },
  playerName: { fontWeight: 600 },
  youBadge: { fontWeight: 400, fontSize: "0.8rem", color: "#6b7280" },
  badge: { fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999 },
  badgeOn: { background: "#00b4d820", color: "#7efff5", border: "1px solid #00b4d8" },
  badgeOff: { background: "#ffffff08", color: "#6b7280", border: "1px solid #2a2d42" },

  centerFull: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    minHeight: "60vh",
    textAlign: "center",
  },
  bigNumber: {
    fontSize: "9rem",
    fontWeight: 900,
    lineHeight: 1,
    background: "linear-gradient(135deg, #7efff5, #00b4d8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  // Round banner
  roundBanner: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
    borderBottom: "1px solid #2a2d42",
    paddingBottom: "1rem",
  },
  roundLabel: { fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" },
  subjectTag: { fontSize: "1rem", color: "#e8eaf0" },

  // Subject waiting
  waitingIcon: { fontSize: "3rem" },
  waitingText: { fontSize: "1.1rem", color: "#94a3b8", textAlign: "center" },

  // Question
  questionMeta: { margin: 0, fontSize: "0.75rem", color: "#6b7280", alignSelf: "flex-start" },
  questionText: {
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: 600,
    lineHeight: 1.7,
    textAlign: "right",
    color: "#e8eaf0",
  },
  optionList: { width: "100%", display: "flex", flexDirection: "column", gap: "0.6rem" },
  optionBtn: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: 12,
    border: "1px solid #2a2d42",
    background: "#12141f",
    color: "#e8eaf0",
    cursor: "pointer",
    textAlign: "right",
    fontSize: "0.95rem",
    transition: "border-color 0.2s",
  },
  optionSelected: { border: "1px solid #00b4d8", background: "#0d1f2d" },
  optionDisabled: { opacity: 0.4, cursor: "default" },
  optionLabel: { fontWeight: 700, color: "#00b4d8", minWidth: 28, flexShrink: 0 },
  optionText: { lineHeight: 1.5 },

  waitingOthers: { width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" },

  // Progress bar
  progressTrack: {
    width: "100%",
    height: 6,
    background: "#24273a",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #7efff5, #00b4d8)",
    borderRadius: 999,
    transition: "width 0.4s ease",
  },

  // Result
  resultTitle: { margin: 0, fontSize: "1.4rem", fontWeight: 700, textAlign: "center", lineHeight: 1.6 },
  resultSub: { fontSize: "0.85rem", fontWeight: 400, color: "#6b7280" },
  accent: { color: "#7efff5" },

  // Trait bars
  traitList: { width: "100%", display: "flex", flexDirection: "column", gap: "0.65rem" },
  traitRow: { display: "flex", alignItems: "center", gap: "0.75rem" },
  traitLabel: { fontSize: "0.85rem", minWidth: 110, textAlign: "right", color: "#94a3b8" },
  traitTrack: {
    flex: 1,
    height: 8,
    background: "#24273a",
    borderRadius: 999,
    overflow: "hidden",
  },
  traitFill: {
    height: "100%",
    background: "linear-gradient(90deg, #7efff5, #00b4d8)",
    borderRadius: 999,
    transition: "width 0.6s ease",
  },
  traitPoints: { fontSize: "0.8rem", color: "#6b7280", minWidth: 28, textAlign: "left" },

  // Game over
  summaryBlock: {
    width: "100%",
    borderTop: "1px solid #2a2d42",
    paddingTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  summaryName: { margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#7efff5" },
};