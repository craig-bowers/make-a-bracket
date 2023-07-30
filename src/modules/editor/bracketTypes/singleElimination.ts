// UUID
import { v4 as uuidv4 } from 'uuid';

// Types
import type {
  NewSettings,
  NewRound,
  NewGame,
  NewParticipant,
  NewStyles,
  Category,
} from '../../../common/types/bracket';

function newGameObject(
  p1: NewParticipant | null,
  p2: NewParticipant | null,
  gameNumber: number
): NewGame {
  return {
    key: uuidv4(),
    number: gameNumber,
    name: `Game ${gameNumber}`,
    player_1: p1 ? p1.key : '',
    player_2: p2 ? p2.key : '',
    winner: '',
    player_1_score: null,
    player_2_score: null,
    time: null,
    location: null,
    details: null,
  };
}

function rounds(participants: NewParticipant[]): NewRound[] {
  if (participants.length < 2) return [];

  let totalGames = participants.length - 1;
  let fullRounds = 1;
  // Calculate complete fullRounds
  while (Math.pow(2, fullRounds + 1) <= participants.length) {
    fullRounds++;
  }
  let totalGamesInLastFullRound = Math.pow(2, fullRounds - 1);
  let remainingParticipants = participants.length - Math.pow(2, fullRounds);
  let roundNumber = 1; // overall round number
  let preRounds = 0; // total # of pre-rounds
  let numberOfFirstPreRoundGames = 0; // # of games in the first pre-round if less than

  while (remainingParticipants) {
    if (remainingParticipants <= totalGamesInLastFullRound) {
      // Check to see if remaining participants is <= total games in the last full round
      numberOfFirstPreRoundGames = remainingParticipants;
      remainingParticipants = 0;
    } else {
      remainingParticipants = remainingParticipants - totalGamesInLastFullRound;
    }
    preRounds++;
  }

  let currentTeam = 0;
  let rounds: NewRound[] = [];
  let currentGame = 1;
  // Pre-round arrays
  for (let r = 1; r <= preRounds; r++) {
    let round: NewRound = {
      key: uuidv4(),
      games: [],
      number: roundNumber++,
      name: `Pre-Round ${r}`,
      timestamp_start: null,
      timestamp_end: null,
      ppg: 1,
    };
    // If it's not a full pre-round / only can happen in first round
    if (rounds.length === 0 && numberOfFirstPreRoundGames) {
      for (let g = 0; g < numberOfFirstPreRoundGames; g++) {
        round.games.push(
          newGameObject(
            participants[currentTeam++],
            participants[currentTeam++],
            currentGame++
          )
        );
      }
      rounds.push(round);
    } else {
      // If it is a full pre-round (the pre-round has totalGamesInLastFullRound number of games)
      for (let g = 0; g < totalGamesInLastFullRound; g++) {
        if (rounds[rounds.length - 1].games[g]) {
          // Checks for previous pre-round games
          round.games.push(
            newGameObject(null, participants[currentTeam++], currentGame++)
          );
        } else {
          round.games.push(
            newGameObject(
              participants[currentTeam++],
              participants[currentTeam++],
              currentGame++
            )
          );
        }
      }
      rounds.push(round);
    }
  }
  // Full-round arrays
  for (
    let gamesInRound = totalGamesInLastFullRound, fullRoundNumber = 1;
    gamesInRound >= 1;
    gamesInRound = gamesInRound / 2, fullRoundNumber++
  ) {
    let round: NewRound = {
      key: uuidv4(),
      games: [],
      number: roundNumber++,
      name: `Round ${fullRoundNumber}`,
      timestamp_start: null,
      timestamp_end: null,
      ppg: 1,
    };
    for (let g = 0; g < gamesInRound; g++) {
      if (fullRoundNumber > 1) {
        // Only the first full-round should have teams by default, so we insert null for both teams here
        round.games.push(newGameObject(null, null, currentGame++));
      } else {
        if (rounds?.[rounds.length - 1]?.games?.[g]) {
          // Checks for pre-round games
          round.games.push(
            newGameObject(null, participants[currentTeam++], currentGame++)
          );
        } else {
          round.games.push(
            newGameObject(
              participants[currentTeam++],
              participants[currentTeam++],
              currentGame++
            )
          );
        }
      }
    }
    rounds.push(round);
  }
  return rounds;
}

function check({
  settings,
  participants,
  rounds,
  // styles,
  categories,
}: {
  settings: NewSettings;
  participants: NewParticipant[];
  rounds: NewRound[];
  // styles: NewStyles;
  categories: Category[];
}) {
  let errors: string[] = [];
  // All
  if (!settings?.slug) errors.push('Missing slug.');
  // Single elimination settings
  // if (settings.bracket_type === 'single-elimination-voting') {
  //   rounds.forEach((round) => {
  //     if (!round.timestamp_end) {
  //       errors.push(`Must set round end time for ${round.name}`);
  //     }
  //   });
  // }
  console.log('errors', errors);
  return errors;
}

let singleElimination = {
  rounds: rounds,
  check: check,
};

export default singleElimination;
