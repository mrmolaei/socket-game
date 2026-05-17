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
  cors: {
    origin: "*",
  },
});

const players = {};
let countdownInterval = null;
let countdownValue = 3;

function allReady() {
  const list = Object.values(players);
  return list.length >= 2 && list.every((p) => p.ready);
}

function startCountdown() {
  if (countdownInterval) return;
  countdownValue = 3;
  io.emit("countdownTick", countdownValue);

  countdownInterval = setInterval(() => {
    if (!allReady()) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      io.emit("countdownAbort");
      return;
    }

    countdownValue -= 1;
    io.emit("countdownTick", countdownValue);

    if (countdownValue <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      io.emit("gameStart");
    }
  }, 1000);
}

function stopCountdown() {
  if (!countdownInterval) return;
  clearInterval(countdownInterval);
  countdownInterval = null;
  io.emit("countdownAbort");
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("joinLobby", (name) => {
    players[socket.id] = { id: socket.id, name, ready: false };
    io.emit("playersUpdate", Object.values(players));
  });

  socket.on("setReady", (ready) => {
    if (!players[socket.id]) return;
    players[socket.id].ready = ready;
    io.emit("playersUpdate", Object.values(players));

    if (allReady()) {
      startCountdown();
    } else {
      stopCountdown();
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playersUpdate", Object.values(players));
    if (!allReady()) stopCountdown();
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Running on ${PORT}`);
});