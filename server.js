import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  COMMON_FINAL_CLUE,
  MAX_DUMPS,
  MAX_RECEIVED_DUMPS,
  CLUE_CODES,
  createInitialPlayers,
  clonePlayers,
  normalizeCodeInput,
  normalizeClueKey,
  getFinalPlaceLabel,
  advancePlayer,
} from './src/gameConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let gameState = {
  huntStarted: false,
  notification: '',
  players: createInitialPlayers(),
};

function emitState(io, notification = gameState.notification) {
  gameState = { ...gameState, notification };
  io.emit('state-updated', gameState);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'dist')));

io.on('connection', (socket) => {
  socket.emit('state-updated', gameState);

  socket.on('join-player', ({ name, greenDyeAllergy }) => {
    const cleanedName = String(name || '').trim();
    const hasGreenDyeAllergy = Boolean(greenDyeAllergy);

    if (!cleanedName) {
      socket.emit('join-error', { message: 'Please enter your name.' });
      return;
    }

    const duplicate = gameState.players.find(
      (player) =>
        !player.name.startsWith('Player ') &&
        player.name.toLowerCase() === cleanedName.toLowerCase(),
    );

    if (duplicate) {
      socket.emit('join-error', {
        message: `"${cleanedName}" is already taken. Try something new.`,
      });
      return;
    }

    let openSlot = null;

    if (hasGreenDyeAllergy) {
      const playerOne = gameState.players[0];
      if (playerOne && playerOne.name.startsWith('Player ')) {
        openSlot = playerOne;
      } else {
        socket.emit('join-error', {
          message: 'Sorry — the allergy-safe slot is already taken. Please get Papa.',
        });
        return;
      }
    } else {
      openSlot =
        gameState.players.find(
          (player) => player.id !== 0 && player.name.startsWith('Player '),
        ) ||
        gameState.players.find((player) => player.name.startsWith('Player '));
    }

    if (!openSlot) {
      socket.emit('join-error', { message: 'All player spots are full.' });
      return;
    }

    const nextPlayers = clonePlayers(gameState.players);
    nextPlayers[openSlot.id] = {
      ...nextPlayers[openSlot.id],
      name: cleanedName,
    };

    gameState = { ...gameState, players: nextPlayers };
    socket.emit('joined-player', { playerId: openSlot.id });
    emitState(io, `${cleanedName} joined the hunt.`);
  });

  socket.on('submit-code', ({ playerId, code }) => {
    const player = gameState.players[playerId];

    if (!player) {
      socket.emit('action-error', { message: 'Invalid player.' });
      return;
    }

    if (!gameState.huntStarted) {
      socket.emit('action-error', {
        message: 'The hunt has not started yet. Wait for Papa to start it.',
      });
      return;
    }

    if (!player.currentClue) {
      socket.emit('action-error', {
        message: 'No clue left for this player.',
      });
      return;
    }

    if (player.currentClue === COMMON_FINAL_CLUE) {
      socket.emit('action-error', {
        message: 'This clue cannot accept a code.',
      });
      return;
    }

    const expectedCode = CLUE_CODES[normalizeClueKey(player.currentClue)];
    const cleanedInput = normalizeCodeInput(code);

    if (!expectedCode) {
      socket.emit('action-error', {
        message: 'No code is mapped to this clue yet.',
      });
      return;
    }

    if (cleanedInput.length !== 3) {
      socket.emit('action-error', {
        message: 'Enter the 3-letter code from the egg.',
      });
      return;
    }

    if (cleanedInput !== expectedCode) {
      socket.emit('action-error', {
        message: `❌ Wrong code for ${player.name}. Try again.`,
      });
      return;
    }

    let nextPlayers = clonePlayers(gameState.players);
    nextPlayers[playerId] = {
      ...nextPlayers[playerId],
      found: nextPlayers[playerId].found + 1,
      dumpedBy: null,
    };

    nextPlayers = advancePlayer(nextPlayers, playerId);
    gameState = { ...gameState, players: nextPlayers };
    emitState(io, `✅ ${player.name} entered the correct code.`);
  });

  socket.on('dump-clue', ({ playerId, targetId }) => {
    const player = gameState.players[playerId];
    const target = gameState.players[targetId];

    if (!player || !target) {
      socket.emit('action-error', { message: 'Invalid player.' });
      return;
    }

    if (!gameState.huntStarted) {
      socket.emit('action-error', {
        message: 'The hunt has not started yet. Wait for Papa to start it.',
      });
      return;
    }

    if (!player.currentClue) {
      socket.emit('action-error', { message: 'No clue left to dump.' });
      return;
    }

    if (player.currentClue === COMMON_FINAL_CLUE) {
      socket.emit('action-error', {
        message: 'You cannot dump the final clue.',
      });
      return;
    }

    if (target.hasUnlockedFinal || target.hasFinishedFinal) {
      socket.emit('action-error', {
        message: 'Sorry. They are at the final clue. No dumping to them.',
      });
      return;
    }

    if (player.dumpsUsed >= MAX_DUMPS) {
      socket.emit('action-error', { message: 'No dumps remaining!' });
      return;
    }

    if (target.dumpsReceived >= MAX_RECEIVED_DUMPS) {
      socket.emit('action-error', {
        message: 'Target already max dumped!',
      });
      return;
    }

    const nextPlayers = clonePlayers(gameState.players);
    const sender = { ...nextPlayers[playerId], queue: [...nextPlayers[playerId].queue] };
    const recipient = { ...nextPlayers[targetId], queue: [...nextPlayers[targetId].queue] };
    const currentClueToDump = sender.currentClue;

    sender.dumpsUsed += 1;
    sender.skipped += 1;
    sender.total = Math.max(0, sender.total - 1);
    sender.dumpedBy = null;

    recipient.dumpsReceived += 1;
    recipient.total += 1;
    recipient.queue = [recipient.currentClue, ...recipient.queue].filter(Boolean);
    recipient.currentClue = `DUMPED · ${currentClueToDump}`;
    recipient.dumpedBy = sender.name;

    nextPlayers[playerId] = sender;
    nextPlayers[targetId] = recipient;

    gameState = { ...gameState, players: advancePlayer(nextPlayers, playerId) };
    emitState(io, `💣 ${sender.name} dumped a clue on ${recipient.name}.`);
  });

  socket.on('start-hunt', () => {
    const joinedCount = gameState.players.filter(
      (entry) => !entry.name.startsWith('Player '),
    ).length;

    if (joinedCount < gameState.players.length) {
      socket.emit('action-error', {
        message: `Only ${joinedCount} of ${gameState.players.length} players have joined so far.`,
      });
      return;
    }

    gameState = { ...gameState, huntStarted: true };
    emitState(io, '🐣 Ask the group if they are ready... START HUNT!');
  });

  socket.on('reset-hunt', () => {
    gameState = {
      huntStarted: false,
      notification: 'Hunt reset.',
      players: createInitialPlayers(),
    };
    emitState(io, 'Hunt reset.');
  });

  socket.on('confirm-papa-hug', ({ playerId }) => {
    const target = gameState.players[playerId];
    const isEligibleForFinalCompletion =
      target?.hasUnlockedFinal && !target?.hasFinishedFinal;

    if (!isEligibleForFinalCompletion) {
      socket.emit('action-error', {
        message: `${target?.name || 'Player'} has not reached the final clue yet.`,
      });
      return;
    }

    const finishingOrder =
      gameState.players.filter((entry) => entry.hasFinishedFinal).length + 1;

    const nextPlayers = clonePlayers(gameState.players);
    nextPlayers[playerId] = {
      ...nextPlayers[playerId],
      awaitingPapaHug: false,
      hasFinishedFinal: true,
      finalPlace: finishingOrder,
    };

    gameState = { ...gameState, players: nextPlayers };

    const prizeText =
      finishingOrder <= 3
        ? `${target.name} is ${getFinalPlaceLabel(finishingOrder)} and wins mega-candy!`
        : `${target.name} finished in ${getFinalPlaceLabel(finishingOrder)}.`;

    emitState(io, `🫂 Papa hug completed for ${target.name}. ${prizeText}`);
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on ${PORT}`);
});
