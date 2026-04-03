export const COMMON_FINAL_CLUE = '🫂👨‍🦳❤️';
export const MAX_DUMPS = 2;
export const MAX_RECEIVED_DUMPS = 2;
export const CLUES_PER_PLAYER = 6;

export const CLUE_CODES = {
  'P1 · Clue 1': 'KEX',
  'P1 · Clue 2': 'ZUM',
  'P1 · Clue 3': 'RAV',
  'P1 · Clue 4': 'TOL',
  'P1 · Clue 5': 'NIP',
  'P1 · Clue 6': 'FUR',
  'P2 · Clue 1': 'DEX',
  'P2 · Clue 2': 'VON',
  'P2 · Clue 3': 'LAX',
  'P2 · Clue 4': 'SIR',
  'P2 · Clue 5': 'QET',
  'P2 · Clue 6': 'BOM',
  'P3 · Clue 1': 'JAX',
  'P3 · Clue 2': 'WEP',
  'P3 · Clue 3': 'CUG',
  'P3 · Clue 4': 'HOV',
  'P3 · Clue 5': 'ZED',
  'P3 · Clue 6': 'MIR',
  'P4 · Clue 1': 'TEX',
  'P4 · Clue 2': 'LOP',
  'P4 · Clue 3': 'VIK',
  'P4 · Clue 4': 'SUN',
  'P4 · Clue 5': 'RIX',
  'P4 · Clue 6': 'BEX',
  'P5 · Clue 1': 'DUN',
  'P5 · Clue 2': 'FEX',
  'P5 · Clue 3': 'KOV',
  'P5 · Clue 4': 'LUM',
  'P5 · Clue 5': 'SAX',
  'P5 · Clue 6': 'NEX',
  'P6 · Clue 1': 'PAX',
  'P6 · Clue 2': 'GEX',
  'P6 · Clue 3': 'RUM',
  'P6 · Clue 4': 'ZAX',
  'P6 · Clue 5': 'WUX',
  'P6 · Clue 6': 'HEX'
};

export function createInitialPlayers() {
  return Array.from({ length: 6 }, (_, index) => {
    const initialQueue = Array.from(
      { length: CLUES_PER_PLAYER },
      (_, clueIndex) => `P${index + 1} · Clue ${clueIndex + 1}`,
    );

    return {
      id: index,
      name: `Player ${index + 1}`,
      finalPlace: null,
      found: 0,
      skipped: 0,
      total: CLUES_PER_PLAYER,
      dumpsUsed: 0,
      dumpsReceived: 0,
      hasUnlockedFinal: false,
      hasFinishedFinal: false,
      awaitingPapaHug: false,
      currentClue: initialQueue[0] ?? null,
      queue: initialQueue.slice(1),
      dumpedBy: null,
    };
  });
}

export function clonePlayers(players) {
  return players.map((player) => ({ ...player, queue: [...player.queue] }));
}

export function normalizeCodeInput(value) {
  return String(value).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
}

export function normalizeClueKey(clue) {
  return String(clue).replace(/^DUMPED · /, '');
}

export function getCompletion(player) {
  if (player.hasFinishedFinal) return 100;
  const totalWithFinal = player.total + 1;
  if (totalWithFinal <= 0) return 0;
  return Math.round((player.found / totalWithFinal) * 100);
}

export function getFinalPlaceLabel(place) {
  if (place === 1) return '🥇 1st';
  if (place === 2) return '🥈 2nd';
  if (place === 3) return '🥉 3rd';
  if (place) return `#${place}`;
  return '';
}

export function advancePlayer(players, playerIndex) {
  const nextPlayers = clonePlayers(players);
  const nextPlayer = { ...nextPlayers[playerIndex], queue: [...nextPlayers[playerIndex].queue] };

  if (nextPlayer.currentClue === COMMON_FINAL_CLUE) {
    nextPlayer.currentClue = null;
    nextPlayer.awaitingPapaHug = true;
    nextPlayer.dumpedBy = null;
    nextPlayers[playerIndex] = nextPlayer;
    return nextPlayers;
  }

  const nextClue = nextPlayer.queue[0] ?? null;
  if (nextClue) {
    nextPlayer.currentClue = nextClue;
    nextPlayer.queue = nextPlayer.queue.slice(1);
    if (!String(nextClue).startsWith('DUMPED · ')) {
      nextPlayer.dumpedBy = null;
    }
  } else if (!nextPlayer.hasUnlockedFinal) {
    nextPlayer.currentClue = COMMON_FINAL_CLUE;
    nextPlayer.hasUnlockedFinal = true;
    nextPlayer.dumpedBy = null;
  } else {
    nextPlayer.currentClue = null;
    nextPlayer.dumpedBy = null;
  }

  nextPlayers[playerIndex] = nextPlayer;
  return nextPlayers;
}
