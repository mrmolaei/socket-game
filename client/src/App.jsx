import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

function App() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    socket.on("playersUpdate", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      socket.off("playersUpdate");
    };
  }, []);

  const joinLobby = () => {
    socket.emit("joinLobby", name);
    setJoined(true);
  };

  return (
    <div>
      {!joined ? (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button onClick={joinLobby}>
            Join
          </button>
        </>
      ) : (
        <>
          <h2>Players</h2>

          {players.map((player) => (
            <div key={player.id}>
              {player.name}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;