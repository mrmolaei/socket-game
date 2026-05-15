const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const players = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinLobby", (playerName) => {
    players[socket.id] = {
      id: socket.id,
      name: playerName,
    };

    io.emit("playersUpdate", Object.values(players));
  });

  socket.on("disconnect", () => {
    delete players[socket.id];

    io.emit("playersUpdate", Object.values(players));

    console.log("User disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});