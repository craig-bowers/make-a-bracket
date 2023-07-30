import { useEffect, useState } from 'react';
// import Fetch from '../../common/utils/fetch/app'; // update the relative path
import Image from 'next/image';

import GameModal from './modal';

import { format } from 'date-fns';

// MUI Custom

// MUI Theme
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// MUI
import {
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Container,
  Divider,
  Unstable_Grid2 as Grid,
  IconButton,
  Input,
  InputAdornment,
  Link as MUILink,
  ListItem,
  Menu,
  MenuItem,
  Modal,
  Paper,
  Stack,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material';

// MUI Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Types
import type {
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
import type { RoundWithDummies, NewRoundWithDummies, DummyGame } from '.';
type MatchComponentProps = {
  rounds: RoundWithDummies[] | NewRoundWithDummies[];
  roundIndex: number;
  gameIndex: number;
  game: Game | NewGame | DummyGame;
  participants: (Participant | NewParticipant)[];
  settings: Settings | NewSettings;
  votes?: Votes;
  setVotes?: React.Dispatch<React.SetStateAction<Votes | undefined>>;
  picks?: (NewUserPick | UserPick)[][];
  setPicks?: React.Dispatch<
    React.SetStateAction<(NewUserPick | UserPick)[][] | undefined>
  >;
};

export default function Match({
  rounds,
  roundIndex,
  gameIndex,
  game,
  participants,
  settings,
  votes,
  setVotes,
  picks,
  setPicks,
}: MatchComponentProps) {
  const theme = useTheme();

  let player_1 =
    (game &&
      'player_1' in game &&
      participants?.find(
        (participant) => participant?.key === game?.player_1
      )) ||
    null;
  let player_2 =
    (game &&
      'player_2' in game &&
      participants?.find(
        (participant) => participant?.key === game?.player_2
      )) ||
    null;

  // NewBracketModal state
  const [openGameModal, setOpenGameModal] = useState(false);
  const handleOpenGameModal = () => setOpenGameModal(true);
  const handleCloseGameModal = () => setOpenGameModal(false);

  return (
    <>
      {'dummy' in game ? (
        <Stack
          alignItems="center"
          sx={{ width: '15em', position: 'relative', visibility: 'hidden' }}
        >
          <Card sx={{ width: '100%' }}>
            <CardActionArea>
              <CardContent>
                <Grid container>
                  <Grid
                    xs={10}
                    sx={{
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography noWrap>dummyA</Typography>
                  </Grid>
                  <Grid xs={2}>
                    <Typography noWrap align="center">
                      --
                    </Typography>
                  </Grid>
                  <Grid xs={12}>
                    <Divider />
                  </Grid>
                  <Grid
                    xs={10}
                    sx={{
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography noWrap>dummyB</Typography>
                  </Grid>
                  <Grid xs={2}>
                    <Typography noWrap align="center">
                      --
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </CardActionArea>
          </Card>
        </Stack>
      ) : (
        <Stack alignItems="center" sx={{ width: '15em', position: 'relative' }}>
          {picks?.[roundIndex - 1]?.[gameIndex * 2] && (
            <Typography>
              {
                participants.find(
                  (participant) =>
                    participant.key === picks[roundIndex][gameIndex].player_1
                )?.name
              }
            </Typography>
          )}
          <Card sx={{ width: '100%' }}>
            <CardActionArea onClick={handleOpenGameModal}>
              <CardContent>
                <Grid container>
                  <Grid
                    xs={10}
                    sx={{
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-start"
                      alignItems="center"
                      py={1}
                    >
                      <Avatar
                        alt={player_1?.name + ' avatar'}
                        src={player_1?.image || ''}
                        sx={{ width: 24, height: 24 }}
                      />
                      <Typography
                        noWrap
                        sx={{
                          fontWeight:
                            game.winner === game.player_1 ? 'bold' : 'normal',
                          flexGrow: 1,
                        }}
                      >
                        {player_1?.name}
                      </Typography>
                      {game?.player_1 &&
                        game?.winner &&
                        game.winner === game.player_1 &&
                        game.winner ===
                          picks?.[roundIndex]?.[gameIndex]?.winner && (
                          <CheckCircleIcon
                            color="primary"
                            // sx={{ flexGrow: 1 }}
                          />
                        )}
                    </Stack>
                  </Grid>
                  <Grid
                    xs={2}
                    justifyContent="center"
                    alignItems="center"
                    display="flex"
                  >
                    <Typography noWrap align="center">
                      {game?.player_1_score || '--'}
                    </Typography>
                  </Grid>
                  <Grid xs={12}>
                    <Divider />
                  </Grid>
                  <Grid
                    xs={10}
                    sx={{
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-start"
                      alignItems="center"
                      py={1}
                    >
                      <Avatar
                        alt={player_2?.name + ' avatar'}
                        src={player_2?.image || ''}
                        sx={{ width: 24, height: 24 }}
                      />
                      <Typography
                        noWrap
                        sx={{
                          fontWeight:
                            game.winner === game.player_2 ? 'bold' : 'normal',
                          flexGrow: 1,
                        }}
                      >
                        {player_2?.name}
                      </Typography>
                      {game?.player_2 &&
                        game?.winner &&
                        game.winner === game.player_2 &&
                        game.winner ===
                          picks?.[roundIndex]?.[gameIndex]?.winner && (
                          <CheckCircleIcon
                            color="primary"
                            // sx={{ flexGrow: 1 }}
                          />
                        )}
                    </Stack>
                  </Grid>
                  <Grid
                    xs={2}
                    justifyContent="center"
                    alignItems="center"
                    display="flex"
                  >
                    <Typography noWrap align="center">
                      {game?.player_2_score || '--'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </CardActionArea>
          </Card>
          {/* {game?.time && (
            <Typography
              position="absolute"
              variant="caption"
              sx={{
                top: '100%',
              }}
            >
              {format(
                new Date(game.time),
                `${settings?.dateFormat || 'MM/dd/yyyy'} @${
                  settings?.timeFormat || 'hh:mm a z'
                }`
              )}
            </Typography>
          )} */}
          {picks?.[roundIndex - 1]?.[gameIndex * 2] && (
            <Typography>
              {
                participants.find(
                  (participant) =>
                    participant.key === picks[roundIndex][gameIndex].player_2
                )?.name
              }
            </Typography>
          )}
        </Stack>
      )}
      {/* This might work on new brackets now
       /* so we can possibly remove the 'id' in settings ... */}
      {openGameModal && !('dummy' in game) && (
        <GameModal
          open={openGameModal}
          handleClose={handleCloseGameModal}
          rounds={rounds}
          participants={participants}
          settings={settings}
          votes={votes}
          setVotes={setVotes}
          picks={picks}
          setPicks={setPicks}
          roundIndex={roundIndex}
          gameIndex={gameIndex}
        />
      )}
    </>
  );
}
