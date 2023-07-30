import { useState, useEffect, useRef, Fragment } from 'react';

// UUID
import { v4 as uuidv4 } from 'uuid';

// New bracket modal
import Match from './match';

// MUI Theme
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// MUI
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Toolbar,
  Typography,
  TextField,
  unstable_useId,
} from '@mui/material';

// Material Icons
import AddBoxSharpIcon from '@mui/icons-material/AddBoxSharp';
import FormatListNumberedSharpIcon from '@mui/icons-material/FormatListNumberedSharp';

// Types
import {
  Round,
  NewRound,
  Game,
  NewGame,
  Participant,
  NewParticipant,
  Settings,
  NewSettings,
  Votes,
  UserPick,
  NewUserPick,
} from '../../common/types/bracket';
type BracketComponentProps = {
  rounds: (Round | NewRound)[];
  participants: (Participant | NewParticipant)[];
  settings: Settings | NewSettings;
  votes?: Votes;
  setVotes?: React.Dispatch<React.SetStateAction<Votes | undefined>>;
  picks?: (NewUserPick | UserPick)[][];
  setPicks?: React.Dispatch<
    React.SetStateAction<(NewUserPick | UserPick)[][] | undefined>
  >;
};

export type RoundWithDummies = Omit<Round, 'games'> & {
  games: GameOrDummy[];
};
export type NewRoundWithDummies = Omit<NewRound, 'games'> & {
  games: NewGameOrDummy[];
};
type GameOrDummy = Game | DummyGame;
type NewGameOrDummy = NewGame | DummyGame;
export type DummyGame = { key: string; dummy: boolean };

export default function Bracket({
  rounds,
  participants,
  settings,
  votes,
  setVotes,
  picks,
  setPicks,
}: BracketComponentProps) {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));

  // Deep copy via JSON stringify/parse
  let roundsWithDummies: RoundWithDummies[] | NewRoundWithDummies[] =
    JSON.parse(JSON.stringify(rounds));
  // If no game & first round, insert hidden dummy component to help with flex
  for (let i = 0; i < rounds?.[1]?.games?.length; i++) {
    if (!rounds?.[0]?.games?.[i] && rounds?.[1]?.games?.[i]) {
      roundsWithDummies?.[0].games.push({
        key: uuidv4(),
        dummy: true,
      });
    }
  }

  let maxGamesInRound = Math.max(
    rounds?.[0]?.games?.length || 0,
    rounds?.[1]?.games?.length || 0
  );

  return (
    <Stack
      direction="row"
      spacing={3}
      sx={{ height: `${maxGamesInRound * 9}em` }}
    >
      {roundsWithDummies?.map((round, roundIndex) => (
        <Fragment key={round.key}>
          <Stack
            justifyContent="space-around"
            alignItems="center"
            sx={{ width: '20em', height: '100%' }}
          >
            {round.games.map((game, gameIndex) => {
              return (
                <Match
                  key={game.key}
                  rounds={rounds}
                  roundIndex={roundIndex}
                  gameIndex={gameIndex}
                  game={game}
                  participants={participants}
                  settings={settings}
                  votes={votes}
                  setVotes={setVotes}
                  picks={picks}
                  setPicks={setPicks}
                />
              );
            })}
          </Stack>
        </Fragment>
      ))}
    </Stack>
  );
}
