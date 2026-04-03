import React, { useEffect, useMemo, useState } from 'react';
import { socket } from './socket';
import {
  COMMON_FINAL_CLUE,
  MAX_DUMPS,
  getCompletion,
  getFinalPlaceLabel,
  normalizeCodeInput,
} from './gameConfig';

function SelectRole() {
  const isAdminPath = window.location.pathname.startsWith('/admin');
  useEffect(() => {
    if (isAdminPath) {
      // no-op; path already selected
    }
  }, [isAdminPath]);

  return (
    <div style={{ maxWidth: 700, margin: '60px auto', fontFamily: 'sans-serif', padding: 20 }}>
      <div style={{ border: '1px solid #ddd', borderRadius: 16, padding: 24, background: 'white' }}>
        <h1>🐣 Easter Egg Hunt</h1>
        <p>Choose how you want to enter the hunt.</p>
        <div style={{ display: 'grid', gap: 14, marginTop: 20 }}>
          <button onClick={() => (window.location.href = '/')} style={{ padding: 16, fontSize: 18 }}>
            📱 Enter as Player
          </button>
          <button onClick={() => (window.location.href = '/admin')} style={{ padding: 16, fontSize: 18 }}>
            👨‍🦳 Enter as Papa
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerJoin({ players, onJoined, actionError }) {
  const [name, setName] = useState('');
  const joinedPlayers = players.filter((player) => !player.name.startsWith('Player '));

  useEffect(() => {
    const handleJoined = ({ playerId }) => onJoined(playerId);
    socket.on('joined-player', handleJoined);
    return () => socket.off('joined-player', handleJoined);
  }, [onJoined]);

  function handleJoin() {
    socket.emit('join-player', { name });
  }

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', fontFamily: 'sans-serif', padding: 20 }}>
      <div style={{ border: '1px solid #ddd', borderRadius: 16, padding: 24, background: 'white' }}>
        <h1 style={{ margin: 0 }}>Enter Your Name</h1>
        <p style={{ marginTop: 12 }}>Enter your name and the app will automatically assign you the next open spot.</p>
        <p style={{ marginTop: 4, color: '#555' }}>
          Players joined: <strong>{joinedPlayers.length}</strong> / <strong>{players.length}</strong>
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            style={{
              flex: 1,
              minWidth: 220,
              padding: '12px 14px',
              borderRadius: 10,
              border: actionError ? '2px solid #c62828' : '1px solid #bbb',
              fontSize: 16,
            }}
          />
          <button onClick={handleJoin}>Join Hunt</button>
        </div>

        {actionError ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              background: '#fff1f1',
              border: '1px solid #d66',
              color: '#8b1e1e',
              fontWeight: 600,
            }}
          >
            {actionError}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PapaPanel({ gameState, onStart, onReset, onConfirmHug, actionError }) {
  const { players, huntStarted } = gameState;
  const joinedCount = players.filter((player) => !player.name.startsWith('Player ')).length;
  const allPlayersJoined = joinedCount === players.length;

  return (
    <div style={{ maxWidth: 1100, margin: '20px auto', fontFamily: 'sans-serif', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>👨‍🦳 Papa Control Panel</h1>
          <p style={{ margin: 0 }}>Open this on Papa’s phone only.</p>
        </div>
      </div>

      <div style={{ border: '2px solid #d8c38f', borderRadius: 14, padding: 16, marginTop: 20, background: '#fff9ec' }}>
        <p>
          Hunt status: <strong>{huntStarted ? 'Started' : 'Waiting to start'}</strong>
          {' · '}
          Players joined: <strong>{joinedCount} / {players.length}</strong>
          {' · '}
          Group status: <strong>{allPlayersJoined ? 'All players joined' : 'Waiting for players'}</strong>
        </p>

        {allPlayersJoined && !huntStarted ? (
          <div
            style={{
              border: '1px solid #7a9f47',
              background: '#f4ffe8',
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
            }}
          >
            ✅ All 6 players are in. Ask if they are ready, then press Start Egg Hunt.
          </div>
        ) : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <button onClick={onStart}>▶️ Start Egg Hunt</button>
          <button onClick={onReset}>🔄 Reset Hunt</button>
        </div>

        {actionError ? (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: '#fff1f1', border: '1px solid #d66', color: '#8b1e1e' }}>
            {actionError}
          </div>
        ) : null}

        <h3>Players and Final Hug Confirmation</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {players.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #e2d4ab',
                borderRadius: 10,
                padding: 10,
                background: 'white',
              }}
            >
              <div>
                <strong>{entry.name}</strong>
                <div style={{ fontSize: 14, color: '#555' }}>
                  {entry.name.startsWith('Player ') ? 'Waiting to join' : 'Joined'}
                  {' · '}
                  {entry.hasFinishedFinal ? `Finished ${getFinalPlaceLabel(entry.finalPlace)}` : entry.hasUnlockedFinal ? 'Doing Final Clue' : 'Still hunting'}
                </div>
              </div>
              <button onClick={() => onConfirmHug(entry.id)} disabled={!entry.hasUnlockedFinal || entry.hasFinishedFinal}>
                🫂 Hug Completed
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerView({ player, players, gameState, actionError, onSubmitCode, onDumpClue }) {
  const [enteredCode, setEnteredCode] = useState('');

  useEffect(() => {
    setEnteredCode('');
  }, [player.currentClue]);

  const attemptedThirdDump = actionError === 'No dumps remaining!';

  const leaderboard = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.hasFinishedFinal !== b.hasFinishedFinal) return Number(b.hasFinishedFinal) - Number(a.hasFinishedFinal);
      if (a.hasUnlockedFinal !== b.hasUnlockedFinal) return Number(b.hasUnlockedFinal) - Number(a.hasUnlockedFinal);
      const aCompletion = getCompletion(a);
      const bCompletion = getCompletion(b);
      if (bCompletion !== aCompletion) return bCompletion - aCompletion;
      if (b.found !== a.found) return b.found - a.found;
      return a.name.localeCompare(b.name);
    });
  }, [players]);

  return (
    <div style={{ maxWidth: 1100, margin: '20px auto', fontFamily: 'sans-serif', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>🐣 Easter Egg Hunt</h1>
          <p style={{ margin: 0 }}>Player view</p>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 20 }}>
        <h2>Current Player: {player.name}</h2>
        <p>
          Hunt: <strong>{gameState.huntStarted ? 'Started' : 'Waiting for Papa'}</strong>
          {' · '}
          Eggs found: <strong>{player.found}</strong> / <strong>{player.total}</strong>
          {' · '}
          Dumps used: <strong>{player.dumpsUsed}</strong> / {MAX_DUMPS}
          {' · '}
          Final clue: <strong>{player.hasFinishedFinal ? 'Finished' : player.hasUnlockedFinal ? 'Doing Final Clue' : 'Locked'}</strong>
        </p>

        {attemptedThirdDump && player.currentClue && player.currentClue !== COMMON_FINAL_CLUE ? (
          <div style={{ background: '#ffe2e2', border: '2px solid #d11a2a', color: '#8a1020', borderRadius: 12, padding: 14, marginBottom: 14, fontWeight: 700 }}>
            ⛔ NO DUMPS REMAINING
          </div>
        ) : null}

        {!gameState.huntStarted ? (
          <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: '#f7f1ff', border: '1px solid #ceb6ff' }}>
            ⏳ Waiting for Papa to start the egg hunt.
          </div>
        ) : player.currentClue === COMMON_FINAL_CLUE ? (
          <>
            <div style={{ fontSize: 28, margin: '20px 0', padding: 20, borderRadius: 12, background: '#f5f5f5', minHeight: 80, display: 'flex', alignItems: 'center' }}>
              {player.currentClue}
            </div>
            <div style={{ marginBottom: 12, padding: 14, borderRadius: 10, background: '#fff4cc', border: '1px solid #e8cf7a' }}>
              Final clue reached. Figure it out, then go find Papa.
            </div>
          </>
        ) : player.currentClue ? (
          <>
            {player.dumpedBy ? (
              <div style={{ background: '#fff4cc', border: '1px solid #e8cf7a', borderRadius: 10, padding: 10, marginBottom: 12 }}>
                💣 This clue was dumped on you by <strong>{player.dumpedBy}</strong>
              </div>
            ) : null}
            <div style={{ fontSize: 28, margin: '20px 0', padding: 20, borderRadius: 12, background: '#f5f5f5', minHeight: 80, display: 'flex', alignItems: 'center' }}>
              {player.currentClue}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <input
                type="text"
                value={enteredCode}
                onChange={(event) => setEnteredCode(normalizeCodeInput(event.target.value))}
                placeholder="Enter 3-letter code"
                maxLength={3}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #bbb', fontSize: 18, width: 180, textTransform: 'uppercase', letterSpacing: 2 }}
              />
              <button onClick={() => onSubmitCode(player.id, enteredCode)}>🔐 Submit Code</button>
            </div>
          </>
        ) : (
          <div style={{ margin: '20px 0', padding: 20, borderRadius: 12, background: '#eef7ee', border: '1px solid #b7d7b7' }}>
            🎉 No more clues left for this player.
          </div>
        )}

        {actionError ? (
          <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: '#fff1f1', border: '1px solid #d66', color: '#8b1e1e' }}>
            {actionError}
          </div>
        ) : null}

        {gameState.huntStarted && player.currentClue && player.currentClue !== COMMON_FINAL_CLUE ? (
          <>
            <h3>💣 Dump This Clue</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {players.map((otherPlayer) => {
                if (otherPlayer.id === player.id) return null;
                return (
                  <button key={otherPlayer.id} onClick={() => onDumpClue(player.id, otherPlayer.id)}>
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
            {entry.hasUnlockedFinal && !entry.hasFinishedFinal ? ' · Doing Final Clue' : ''}
            {entry.hasFinishedFinal ? ` · Finished ${getFinalPlaceLabel(entry.finalPlace)}` : ''}
          </li>
        ))}
      </ul>

      {gameState.notification ? (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            background: gameState.notification.includes('🫂') ? '#fff4cc' : '#eef',
            border: gameState.notification.includes('🫂') ? '2px solid gold' : '1px solid #99f',
            fontSize: gameState.notification.includes('🫂') ? 24 : 16,
            fontWeight: gameState.notification.includes('🫂') ? 700 : 400,
            textAlign: 'center',
          }}
        >
          {gameState.notification}
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [gameState, setGameState] = useState({ players: [], huntStarted: false, notification: '' });
  const [playerId, setPlayerId] = useState(() => {
    const saved = window.localStorage.getItem('egg-hunt-player-id');
    return saved == null ? null : Number(saved);
  });
  const [actionError, setActionError] = useState('');

  const isAdmin = window.location.pathname.startsWith('/admin');

  useEffect(() => {
    const onStateUpdated = (nextState) => {
      setGameState(nextState);
      setActionError('');
    };
    const onJoinError = ({ message }) => setActionError(message);
    const onActionError = ({ message }) => setActionError(message);

    socket.on('state-updated', onStateUpdated);
    socket.on('join-error', onJoinError);
    socket.on('action-error', onActionError);

    return () => {
      socket.off('state-updated', onStateUpdated);
      socket.off('join-error', onJoinError);
      socket.off('action-error', onActionError);
    };
  }, []);

  useEffect(() => {
    if (playerId == null) {
      window.localStorage.removeItem('egg-hunt-player-id');
    } else {
      window.localStorage.setItem('egg-hunt-player-id', String(playerId));
    }
  }, [playerId]);

  const players = gameState.players || [];
  const player = playerId == null ? null : players.find((entry) => entry.id === playerId) || null;

  if (!isAdmin && !player) {
    if (window.location.pathname !== '/') {
      return <SelectRole />;
    }

    return <PlayerJoin players={players} onJoined={setPlayerId} actionError={actionError} />;
  }

  if (isAdmin) {
    return (
      <PapaPanel
        gameState={gameState}
        players={players}
        actionError={actionError}
        onStart={() => socket.emit('start-hunt')}
        onReset={() => {
          if (window.confirm('Are you sure you want to reset the hunt? This will erase all progress.')) {
            socket.emit('reset-hunt');
          }
        }}
        onConfirmHug={(id) => socket.emit('confirm-papa-hug', { playerId: id })}
      />
    );
  }

  return (
    <PlayerView
      player={player}
      players={players}
      gameState={gameState}
      actionError={actionError}
      onSubmitCode={(id, code) => socket.emit('submit-code', { playerId: id, code })}
      onDumpClue={(playerIdArg, targetId) => socket.emit('dump-clue', { playerId: playerIdArg, targetId })}
    />
  );
}
