import React, { useEffect, useMemo, useState } from "react";
import { socket } from "./socket";

const COMMON_FINAL_CLUE = "🫂👨‍🦳❤️";
const MAX_DUMPS = 2;

const CLUE_TEXT = {
  "P1 · Clue 1": "🍳🥘🚪",
  "P1 · Clue 2": "🚽⚾📖",
  "P1 · Clue 3": "🪜🚪⬇️",
  "P1 · Clue 4": "👴💻📄",
  "P1 · Clue 5": "🎨🖍️🖼️",
  "P1 · Clue 6": "📺🪑⬇️",

  "P2 · Clue 1": "🚿🧴🧔",
  "P2 · Clue 2": "🔥🍔🌳",
  "P2 · Clue 3": "🪑📚🚪",
  "P2 · Clue 4": "🔥💨👕",
  "P2 · Clue 5": "🚰🍴🫧",
  "P2 · Clue 6": "🌶️🧂🫙",

  "P3 · Clue 1": "🔪🍞🛡️",
  "P3 · Clue 2": "🚰🍽️🧽",
  "P3 · Clue 3": "🛏️😴👴",
  "P3 · Clue 4": "🏚️🌿🔧",
  "P3 · Clue 5": "🍫🥜🍬",
  "P3 · Clue 6": "📬📨📥",

  "P4 · Clue 1": "🚗🧊🥤",
  "P4 · Clue 2": "🍎🥛🧊",
  "P4 · Clue 3": "🔊🗣️🏠",
  "P4 · Clue 4": "🧥🎒🚪",
  "P4 · Clue 5": "♨️💧🌙",
  "P4 · Clue 6": "📚📖🪟",

  "P5 · Clue 1": "♻️🗑️🚮",
  "P5 · Clue 2": "🍽️⚡🔥",
  "P5 · Clue 3": "🧺🫧🧼",
  "P5 · Clue 4": "📺🛌👩",
  "P5 · Clue 5": "🪟🌳👀",
  "P5 · Clue 6": "🛋️📺🧃",

  "P6 · Clue 1": "🚪🌳🚧",
  "P6 · Clue 2": "🎮🧠❓",
  "P6 · Clue 3": "🎲🧩🎯",
  "P6 · Clue 4": "🚗💀⚠️",
  "P6 · Clue 5": "🧊❄️🥶",
  "P6 · Clue 6": "🍽️🚿💦",
};

function normalizeCodeInput(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

function normalizeClueKey(clue) {
  return String(clue || "").replace(/^DUMPED · /, "");
}

function getFinalPlaceLabel(place) {
  if (place === 1) return "🥇 1st";
  if (place === 2) return "🥈 2nd";
  if (place === 3) return "🥉 3rd";
  if (place) return `#${place}`;
  return "";
}

function getCompletion(player) {
  if (!player) return 0;
  if (player.hasFinishedFinal) return 100;
  const totalWithFinal = player.total + 1;
  if (totalWithFinal <= 0) return 0;
  return Math.round((player.found / totalWithFinal) * 100);
}

function SelectRole({ onChooseRole, isAdminRoute }) {
  const [showPapaPrompt, setShowPapaPrompt] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [papaError, setPapaError] = useState("");

  useEffect(() => {
    if (isAdminRoute) {
      setShowPapaPrompt(true);
    }
  }, [isAdminRoute]);

  function handlePapaSubmit() {
    if (birthYear.trim() === "1959") {
      setPapaError("");
      onChooseRole("admin");
      return;
    }

    setPapaError("Nice try. Papa only.");
  }

  if (showPapaPrompt) {
    return (
      <div style={{ maxWidth: 700, margin: "60px auto", fontFamily: "sans-serif", padding: 20 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "white" }}>
          <h1>👨‍🦳 Enter as Papa</h1>
          <p>Enter your year of birth.</p>

          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <input
              value={birthYear}
              onChange={(event) => {
                setBirthYear(event.target.value);
                if (papaError) setPapaError("");
              }}
              placeholder="Year of birth"
              inputMode="numeric"
              style={{
                flex: 1,
                minWidth: 180,
                padding: "12px 14px",
                borderRadius: 10,
                border: papaError ? "2px solid #c62828" : "1px solid #bbb",
                fontSize: 16,
              }}
            />
            <button onClick={handlePapaSubmit}>Continue</button>
          </div>

          {papaError ? (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background: "#fff1f1",
                border: "1px solid #d66",
                color: "#8b1e1e",
                fontWeight: 600,
              }}
            >
              {papaError}
            </div>
          ) : null}

          {!isAdminRoute ? (
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setShowPapaPrompt(false)}>← Back</button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "60px auto", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "white" }}>
        <h1>🐣 Easter Egg Hunt</h1>
        <p>Choose how you want to enter the hunt.</p>
        <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
          <button onClick={() => onChooseRole("player")} style={{ padding: 16, fontSize: 18 }}>
            🧒 Enter as Grandchild
          </button>
          <button onClick={() => setShowPapaPrompt(true)} style={{ padding: 16, fontSize: 18 }}>
            👨‍🦳 Enter as Papa
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerJoin({ players, onJoin, onResumePlayer, onBack, joinError }) {
  const [name, setName] = useState("");
  const joinedPlayers = players.filter((player) => !player.name.startsWith("Player "));
  const joinedCount = joinedPlayers.length;

  function handleJoin() {
    onJoin(name.trim());
  }

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24, background: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0 }}>Enter Your Name</h1>
          <button onClick={onBack}>← Back</button>
        </div>

        <p style={{ marginTop: 12 }}>
          Enter your name and the app will automatically assign you the next open spot.
        </p>

        <p style={{ marginTop: 4, color: "#555" }}>
          Players joined: <strong>{joinedCount}</strong> / <strong>{players.length}</strong>
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            style={{
              flex: 1,
              minWidth: 220,
              padding: "12px 14px",
              borderRadius: 10,
              border: joinError ? "2px solid #c62828" : "1px solid #bbb",
              fontSize: 16,
            }}
          />
          <button onClick={handleJoin}>Join Hunt</button>
        </div>

        {joinError ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              background: "#fff1f1",
              border: "1px solid #d66",
              color: "#8b1e1e",
              fontWeight: 600,
            }}
          >
            {joinError}
          </div>
        ) : null}

        {joinedPlayers.length ? (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 10 }}>Re-enter as an existing player</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {joinedPlayers.map((joinedPlayer) => (
                <button key={joinedPlayer.id} onClick={() => onResumePlayer(joinedPlayer.id)}>
                  {joinedPlayer.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PapaPanel({
  gameState,
  showResetConfirm,
  onBack,
  onStartHunt,
  onRequestReset,
  onConfirmReset,
  onCancelReset,
  onConfirmPapaHug,
}) {
  const players = gameState.players || [];
  const joinedCount = players.filter((player) => !player.name.startsWith("Player ")).length;
  const allPlayersJoined = players.length > 0 && joinedCount === players.length;

  return (
    <div style={{ maxWidth: 1100, margin: "20px auto", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>👨‍🦳 Papa</h1>
          <p style={{ margin: 0 }}>Admin view</p>
        </div>
        {!window.location.pathname.startsWith("/admin") ? <button onClick={onBack}>← Exit Papa View</button> : null}
      </div>

      <div style={{ border: "2px solid #d8c38f", borderRadius: 14, padding: 16, marginTop: 20, background: "#fff9ec" }}>
        <p>
          Hunt status: <strong>{gameState.huntStarted ? "Started" : "Waiting to start"}</strong>
          {" · "}
          Players joined: <strong>{joinedCount} / {players.length}</strong>
          {" · "}
          Group status: <strong>{allPlayersJoined ? "All players joined" : "Waiting for players"}</strong>
        </p>

        {allPlayersJoined && !gameState.huntStarted ? (
          <div
            style={{
              border: "1px solid #7a9f47",
              background: "#f4ffe8",
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
            }}
          >
            ✅ All 6 players are in. Ask the group if they are ready, then press Start Egg Hunt.
          </div>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <button onClick={onStartHunt}>▶️ Start Egg Hunt</button>
          <button onClick={onRequestReset}>🔄 Reset Hunt</button>
        </div>

        {showResetConfirm ? (
          <div
            style={{
              border: "2px solid #c44",
              background: "#fff1f1",
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <strong>Are you sure you want to reset the hunt?</strong>
            <div style={{ marginTop: 8, color: "#7a1f1f" }}>
              This will erase all progress, joined names, and final placements.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button onClick={onConfirmReset}>Yes, Reset Hunt</button>
              <button onClick={onCancelReset}>Cancel</button>
            </div>
          </div>
        ) : null}

        <h3>Players and Final Hug Confirmation</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {players.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #e2d4ab",
                borderRadius: 10,
                padding: 10,
                background: "white",
              }}
            >
              <div>
                <strong>{entry.name}</strong>
                <div style={{ fontSize: 14, color: "#555" }}>
                  {entry.name.startsWith("Player ") ? "Waiting to join" : "Joined"}
                  {" · "}
                  {entry.hasFinishedFinal
                    ? `Finished ${getFinalPlaceLabel(entry.finalPlace)}`
                    : entry.hasUnlockedFinal
                      ? "Doing Final Clue"
                      : "Still hunting"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => onConfirmPapaHug(entry.id)}
                  disabled={!entry.hasUnlockedFinal || entry.hasFinishedFinal}
                >
                  🫂 Hug Completed
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerView({
  player,
  players,
  gameState,
  notification,
  enteredCode,
  setEnteredCode,
  onBack,
  onSubmitCode,
  onDumpClue,
}) {
  const leaderboard = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.hasFinishedFinal !== b.hasFinishedFinal) {
        return Number(b.hasFinishedFinal) - Number(a.hasFinishedFinal);
      }
      if (a.hasUnlockedFinal !== b.hasUnlockedFinal) {
        return Number(b.hasUnlockedFinal) - Number(a.hasUnlockedFinal);
      }

      const aCompletion = getCompletion(a);
      const bCompletion = getCompletion(b);

      if (bCompletion !== aCompletion) return bCompletion - aCompletion;
      if (b.found !== a.found) return b.found - a.found;
      return a.name.localeCompare(b.name);
    });
  }, [players]);

  return (
    <div style={{ maxWidth: 1100, margin: "20px auto", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>🐣 Easter Egg Hunt</h1>
          <p style={{ margin: 0 }}>Player view</p>
        </div>
        {!window.location.pathname.startsWith("/admin") ? <button onClick={onBack}>← Change Player</button> : null}
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 20 }}>
        <h2>Current Player: {player.name}</h2>
        <p>
          Hunt: <strong>{gameState.huntStarted ? "Started" : "Waiting for Papa"}</strong>
          {" · "}
          Eggs found: <strong>{player.found}</strong> / <strong>{player.total}</strong>
          {" · "}
          Dumps used: <strong>{player.dumpsUsed}</strong> / {MAX_DUMPS}
          {" · "}
          Final clue: <strong>{player.hasFinishedFinal ? "Finished" : player.hasUnlockedFinal ? "Doing Final Clue" : "Locked"}</strong>
        </p>

        {!gameState.huntStarted ? (
          <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: "#f7f1ff", border: "1px solid #ceb6ff" }}>
            ⏳ Waiting for Papa to start the egg hunt.
          </div>
        ) : player.currentClue === COMMON_FINAL_CLUE ? (
          <div
            style={{
              fontSize: 36,
              margin: "20px 0",
              padding: 24,
              borderRadius: 12,
              background: "#f5f5f5",
              minHeight: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {player.currentClue}
          </div>
        ) : player.currentClue ? (
          <>
            {player.dumpedBy ? (
              <div
                style={{
                  background: "#fff4cc",
                  border: "1px solid #e8cf7a",
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 12,
                }}
              >
                💣 This clue was dumped on you by <strong>{player.dumpedBy}</strong>
              </div>
            ) : null}

            <div
              style={{
                fontSize: 36,
                margin: "20px 0",
                padding: 20,
                borderRadius: 12,
                background: "#f5f5f5",
                minHeight: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {CLUE_TEXT[normalizeClueKey(player.currentClue)] || player.currentClue}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <input
                type="text"
                value={enteredCode}
                onChange={(event) => setEnteredCode(normalizeCodeInput(event.target.value))}
                placeholder="Enter 3-letter code"
                maxLength={3}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #bbb",
                  fontSize: 18,
                  width: 180,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              />
              <button onClick={onSubmitCode}>🔐 Submit Code</button>
            </div>
          </>
        ) : (
          <div
            style={{
              margin: "20px 0",
              padding: 20,
              borderRadius: 12,
              background: "#eef7ee",
              border: "1px solid #b7d7b7",
            }}
          >
            🎉 No more clues left for this player.
          </div>
        )}

        {gameState.huntStarted && player.currentClue && player.currentClue !== COMMON_FINAL_CLUE ? (
          <>
            <h3>💣 Dump This Clue</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {players.map((otherPlayer) => {
                if (otherPlayer.id === player.id) return null;
                return (
                  <button key={otherPlayer.id} onClick={() => onDumpClue(otherPlayer.id)}>
                    Dump to {otherPlayer.name}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      <h3>📊 Leaderboard</h3>
      <ul>
        {leaderboard.map((entry) => (
          <li key={entry.id}>
            {entry.name}: {entry.found} / {entry.total} ({getCompletion(entry)}%)
            {entry.hasUnlockedFinal && !entry.hasFinishedFinal ? " · Doing Final Clue" : ""}
            {entry.hasFinishedFinal ? ` · Finished ${getFinalPlaceLabel(entry.finalPlace)}` : ""}
          </li>
        ))}
      </ul>

      {notification ? (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            background: notification.includes("🫂") ? "#fff4cc" : "#eef",
            border: notification.includes("🫂") ? "2px solid gold" : "1px solid #99f",
            fontSize: notification.includes("🫂") ? 24 : 16,
            fontWeight: notification.includes("🫂") ? 700 : 400,
            textAlign: "center",
          }}
        >
          {notification}
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [gameState, setGameState] = useState({ huntStarted: false, players: [], notification: "" });
  const [role, setRole] = useState(null);
  const [playerId, setPlayerId] = useState(() => {
    const saved = localStorage.getItem("egg-hunt-player-id");
    return saved == null ? null : Number(saved);
  });
  const [enteredCode, setEnteredCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [actionError, setActionError] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isAdminRoute = window.location.pathname.startsWith("/admin");
  const players = gameState.players || [];
  const player = playerId == null ? null : players.find((entry) => entry.id === playerId) || null;
  const notification = actionError || joinError || gameState.notification || "";

  useEffect(() => {
    socket.on("state-updated", (nextState) => {
      setGameState(nextState);

      if (playerId != null) {
        const existingPlayer = nextState.players?.find((entry) => entry.id === playerId);
        if (!existingPlayer || existingPlayer.name.startsWith("Player ")) {
          setPlayerId(null);
          localStorage.removeItem("egg-hunt-player-id");
        }
      }
    });

    socket.on("join-error", ({ message }) => {
      setJoinError(message || "Unable to join.");
    });

    socket.on("action-error", ({ message }) => {
      setActionError(message || "Action failed.");
    });

    socket.on("joined-player", ({ playerId: joinedPlayerId }) => {
      setPlayerId(joinedPlayerId);
      localStorage.setItem("egg-hunt-player-id", String(joinedPlayerId));
      setJoinError("");
      setActionError("");
    });

    return () => {
      socket.off("state-updated");
      socket.off("join-error");
      socket.off("action-error");
      socket.off("joined-player");
    };
  }, [playerId]);

  useEffect(() => {
    if (isAdminRoute) setRole("admin");
  }, [isAdminRoute]);

  function handleJoin(name) {
    setJoinError("");
    setActionError("");
    socket.emit("join-player", { name });
  }

  function handleResumePlayer(existingPlayerId) {
    setPlayerId(existingPlayerId);
    localStorage.setItem("egg-hunt-player-id", String(existingPlayerId));
    setJoinError("");
    setActionError("");
  }

  function handleBack() {
    if (isAdminRoute) return;
    setRole(null);
    setEnteredCode("");
    setJoinError("");
    setActionError("");
  }

  function handleSubmitCode() {
    if (!player) return;
    setActionError("");
    socket.emit("submit-code", { playerId: player.id, code: enteredCode });
    setEnteredCode("");
  }

  function handleDumpClue(targetId) {
    if (!player) return;
    setActionError("");
    socket.emit("dump-clue", { playerId: player.id, targetId });
  }

  function handleStartHunt() {
    setActionError("");
    socket.emit("start-hunt");
  }

  function handleRequestReset() {
    setShowResetConfirm(true);
  }

  function handleCancelReset() {
    setShowResetConfirm(false);
  }

  function handleConfirmReset() {
    setShowResetConfirm(false);
    socket.emit("reset-hunt");
    setPlayerId(null);
    localStorage.removeItem("egg-hunt-player-id");
  }

  function handleConfirmPapaHug(targetPlayerId) {
    setActionError("");
    socket.emit("confirm-papa-hug", { playerId: targetPlayerId });
  }

  if (!role) {
    return <SelectRole onChooseRole={setRole} isAdminRoute={isAdminRoute} />;
  }

  if (role === "admin") {
    return (
      <PapaPanel
        gameState={gameState}
        showResetConfirm={showResetConfirm}
        onBack={handleBack}
        onStartHunt={handleStartHunt}
        onRequestReset={handleRequestReset}
        onConfirmReset={handleConfirmReset}
        onCancelReset={handleCancelReset}
        onConfirmPapaHug={handleConfirmPapaHug}
      />
    );
  }

  if (!player) {
    return (
      <PlayerJoin
        players={players}
        onJoin={handleJoin}
        onResumePlayer={handleResumePlayer}
        onBack={handleBack}
        joinError={joinError}
      />
    );
  }

  return (
    <PlayerView
      player={player}
      players={players}
      gameState={gameState}
      notification={notification}
      enteredCode={enteredCode}
      setEnteredCode={setEnteredCode}
      onBack={handleBack}
      onSubmitCode={handleSubmitCode}
      onDumpClue={handleDumpClue}
    />
  );
}
