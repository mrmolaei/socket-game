import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://nodejs-production-11bf.up.railway.app");

function App() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(null); // null = no countdown
  const startedRef = useRef(false);

  useEffect(() => {
    socket.on("playersUpdate", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("countdownTick", (value) => {
      setCountdown(value);
    });

    socket.on("countdownAbort", () => {
      setCountdown(null);
    });

    socket.on("gameStart", () => {
      if (startedRef.current) return;
      startedRef.current = true;
      // 👇 Replace this with your navigation logic, e.g. navigate("/game")
      alert("Game started! Navigate to your game here.");
    });

    return () => {
      socket.off("playersUpdate");
      socket.off("countdownTick");
      socket.off("countdownAbort");
      socket.off("gameStart");
    };
  }, []);

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

  const isCountingDown = countdown !== null;

  return (
    <div style={styles.page}>
      {/* ── Name entry ─────────────────────────────────────── */}
      {!joined ? (
        <div style={styles.card}>
          <h1 style={styles.title}>Join Lobby</h1>
          <input
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinLobby()}
          />
          <button style={styles.joinBtn} onClick={joinLobby}>
            Join
          </button>
        </div>
      ) : (
        <div style={styles.card}>
          <h1 style={styles.title}>Lobby</h1>

          {/* ── Player list ──────────────────────────────────── */}
          <p style={styles.subheading}>
            {players.filter((p) => p.ready).length}/{players.length} ready
          </p>
          <ul style={styles.playerList}>
            {players.map((player) => (
              <li key={player.id} style={styles.playerRow}>
                <span style={styles.playerName}>
                  {player.name}
                  {player.id === socket.id && (
                    <span style={styles.youBadge}> (you)</span>
                  )}
                </span>
                <span
                  style={{
                    ...styles.badge,
                    ...(player.ready ? styles.badgeReady : styles.badgeWaiting),
                  }}
                >
                  {player.ready ? "✓ Ready" : "Waiting…"}
                </span>
              </li>
            ))}
          </ul>

          {/* ── Ready button ─────────────────────────────────── */}
          {!isCountingDown && (
            <button
              style={{ ...styles.readyBtn, ...(ready ? styles.readyBtnActive : {}) }}
              onClick={toggleReady}
            >
              {ready ? "✓ Ready!" : "Click when Ready"}
            </button>
          )}

          {/* ── Waiting hint ─────────────────────────────────── */}
          {!isCountingDown && (
            <p style={styles.hint}>
              {players.length < 2
                ? "Waiting for more players…"
                : players.filter((p) => p.ready).length < players.length
                ? `Waiting for ${
                    players.length - players.filter((p) => p.ready).length
                  } more player(s)…`
                : "All ready!"}
            </p>
          )}

          {/* ── Countdown overlay ────────────────────────────── */}
          {isCountingDown && (
            <div style={styles.overlay}>
              <div style={styles.countdownNumber}>
                {countdown === 0 ? "GO!" : countdown}
              </div>
              <p style={styles.countdownLabel}>Game starting…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inline styles ───────────────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f1117",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#e8eaf0",
    padding: "1rem",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: 440,
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
  subheading: {
    margin: 0,
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6b7280",
    alignSelf: "flex-start",
  },
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
  },
  joinBtn: {
    width: "100%",
    padding: "0.85rem",
    fontSize: "1rem",
    fontWeight: 700,
    borderRadius: 10,
    border: "none",
    background: "#00b4d8",
    color: "#0f1117",
    cursor: "pointer",
    letterSpacing: "0.05em",
  },
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
  badge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.2rem 0.6rem",
    borderRadius: 999,
  },
  badgeReady: {
    background: "#00b4d820",
    color: "#7efff5",
    border: "1px solid #00b4d8",
  },
  badgeWaiting: {
    background: "#ffffff08",
    color: "#6b7280",
    border: "1px solid #2a2d42",
  },
  readyBtn: {
    width: "100%",
    padding: "0.85rem",
    fontSize: "1rem",
    fontWeight: 700,
    borderRadius: 10,
    border: "2px solid #00b4d8",
    background: "transparent",
    color: "#7efff5",
    cursor: "pointer",
    letterSpacing: "0.05em",
    transition: "all 0.2s",
  },
  readyBtnActive: {
    background: "#00b4d8",
    color: "#0f1117",
  },
  hint: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#6b7280",
    textAlign: "center",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    borderRadius: 20,
    background: "#0f1117ee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    backdropFilter: "blur(6px)",
    zIndex: 10,
  },
  countdownNumber: {
    fontSize: "8rem",
    fontWeight: 900,
    lineHeight: 1,
    background: "linear-gradient(135deg, #7efff5, #00b4d8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  countdownLabel: {
    margin: 0,
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
  },
};

export default App;