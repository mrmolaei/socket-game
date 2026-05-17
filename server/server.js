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

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("joinLobby", (name) => {
    players[socket.id] = {
      id: socket.id,
      name,
    };

    io.emit("playersUpdate", Object.values(players));
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playersUpdate", Object.values(players));
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Running on ${PORT}`);
});