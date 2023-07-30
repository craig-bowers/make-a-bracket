import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

// Utils
import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import { format } from 'date-fns';
import Tiptap from '../../common/components/Tiptap';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import { useSnackbarContext } from '../../common/contexts/mui';

// Mui Colors
import { grey } from '@mui/material/colors';

// MUI
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  Link as MUILink,
  Modal,
  Paper,
  Stack,
  Typography,
  TextField,
} from '@mui/material';

// MUI Icons
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PlaceIcon from '@mui/icons-material/Place';

// Types
import {
  NewGame,
  Participant,
  NewParticipant,
  Settings,
  NewSettings,
  Votes,
  UserPick,
  NewUserPick,
} from '../../common/types/bracket';
import { RoundWithDummies, NewRoundWithDummies } from '.';
type GameModalComponentProps = {
  open: boolean;
  handleClose: () => void;
  rounds: RoundWithDummies[] | NewRoundWithDummies[];
  participants: (Participant | NewParticipant)[];
  settings: Settings | NewSettings;
  votes?: Votes;
  setVotes?: React.Dispatch<React.SetStateAction<Votes | undefined>>;
  picks?: (NewUserPick | UserPick)[][];
  setPicks?: React.Dispatch<
    React.SetStateAction<(NewUserPick | UserPick)[][] | undefined>
  >;
  roundIndex: number;
  gameIndex: number;
};
type InfoComponent = {
  info: InfoProps;
  game: NewGame;
  player_1?: Participant | NewParticipant;
  player_2?: Participant | NewParticipant;
};
type InfoProps = 'game' | 'team';

import type { GetGameVotes } from '../../pages/api/bracket/getGameVotes/[gameKey]';
import type { CastGameVote } from '../../pages/api/bracket/castGameVote';

// ################################################
// ################################################
// ################ FUNCTION START ################
// ################################################
// ################################################

export default function GameModal({
  open,
  handleClose,
  roundIndex: initialRoundIndex,
  gameIndex: initialGameIndex,
  rounds,
  participants,
  settings,
  votes,
  setVotes,
  picks,
  setPicks,
}: GameModalComponentProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const snackbar = useSnackbarContext();

  const timeoutRef = useRef<NodeJS.Timeout>();

  const [roundIndex, setRoundIndex] = useState(initialRoundIndex);
  const [gameIndex, setGameIndex] = useState(initialGameIndex);
  const [round, setRound] = useState<RoundWithDummies | NewRoundWithDummies>(
    rounds[roundIndex]
  );
  const [game, setGame] = useState(rounds[roundIndex].games[gameIndex]);

  const [pick, setPick] = useState<string>(
    picks?.[roundIndex]?.[gameIndex]?.winner || ''
  );

  const [player_1_score, setPlayer_1_score] = useState(
    picks?.[roundIndex]?.[gameIndex]?.player_1_score || ''
  );
  const [player_2_score, setPlayer_2_score] = useState(
    picks?.[roundIndex]?.[gameIndex]?.player_2_score || ''
  );

  const [vote, setVote] = useState(
    () =>
      votes?.user.find((vote) => vote.game_key === game.key)?.participant_key
  );

  const [info, setInfo] = useState<InfoProps>('game');

  let player_1: NewParticipant | Participant | undefined;
  let player_2: NewParticipant | Participant | undefined;

  if (!('dummy' in game)) {
    player_1 = participants?.find(
      (participant) =>
        participant?.key ===
        (game?.player_1 || picks?.[roundIndex]?.[gameIndex]?.player_1)
    );

    player_2 = participants?.find(
      (participant) =>
        participant?.key ===
        (game?.player_2 || picks?.[roundIndex]?.[gameIndex]?.player_2)
    );
  }

  useEffect(() => {
    setRound(() => rounds[roundIndex]);
    setGame(() => rounds[roundIndex].games[gameIndex]);
    setPick(() => picks?.[roundIndex]?.[gameIndex]?.winner || '');
    setPlayer_1_score(
      () => picks?.[roundIndex]?.[gameIndex]?.player_1_score || ''
    );
    setPlayer_2_score(
      () => picks?.[roundIndex]?.[gameIndex]?.player_2_score || ''
    );
  }, [game, gameIndex, picks, roundIndex, rounds]);

  useEffect(() => {
    if (
      setVotes !== undefined &&
      settings.bracket_type === 'single-elimination-voting' &&
      'id' in settings
    ) {
      (async () => {
        let res = await fetch(`/api/bracket/getGameVotes/${game.key}`, {
          headers: { 'Content-type': 'application/json' },
        });
        let gameVotes: GetGameVotes = await res.json();
        setVotes((prev) => {
          if (gameVotes !== null && 'message' in gameVotes) {
            return prev;
          } else {
            let updatedVotes: Votes = JSON.parse(JSON.stringify(prev));
            if (gameVotes !== null) {
              updatedVotes.games[game.key] = gameVotes;
              return updatedVotes;
            }
          }
        });
      })();
    }
  }, [game, router, setVotes, settings, vote]);

  useEffect(() => {
    setVote(
      () =>
        votes?.user.find((vote) => vote.game_key === game.key)?.participant_key
    );
  }, [game]);

  const disabledTest = useMemo(() => {
    let dTest = false;
    if (!session) {
      dTest = true;
    }
    if (!('dummy' in game) && game.winner !== '' && game.winner !== null) {
      dTest = true;
    }
    if (round.timestamp_start) {
      if (new Date() < new Date(round.timestamp_start)) dTest = true;
    }
    if (round.timestamp_end) {
      if (new Date() > new Date(round.timestamp_end)) dTest = true;
    }
    if (!('dummy' in game) && game.time) {
      if (new Date() > new Date(game.time)) dTest = true;
    }
    if (
      settings?.publish_timestamp &&
      new Date(settings.publish_timestamp) > new Date()
    ) {
      dTest = true;
    }
    if (settings?.published === false) {
      dTest = true;
    }
    return dTest;
  }, [session, game, round, settings]);

  function VoteButton({
    player,
    otherPlayer,
  }: {
    player: Participant;
    otherPlayer: Participant;
  }) {
    if ('id' in settings && votes !== undefined && setVotes !== undefined) {
      return (
        <Button
          fullWidth
          variant={vote === player?.key ? 'contained' : 'text'}
          disabled={disabledTest}
          onClick={async () => {
            let method;
            if (!vote || vote === otherPlayer?.key) method = 'PUT';
            else if (vote === player?.key) method = 'DELETE';

            if (method === 'DELETE') {
              await fetch(
                `/api/bracket/castGameVote?bracket_id=${settings.id}&game_key=${game.key}&participant_key=${player?.key}`,
                {
                  method: method,
                  headers: {
                    'Content-type': 'application/json',
                  },
                }
              );
              setVotes((prev) => {
                let updatedVotes: Votes | undefined = JSON.parse(
                  JSON.stringify(prev)
                );
                if (updatedVotes?.user && Array.isArray(updatedVotes.user)) {
                  updatedVotes.user = updatedVotes?.user?.filter(
                    (vote) => vote.game_key !== game.key
                  );
                }
                return updatedVotes;
              });
              setVote(() => {
                return undefined;
              });
            } else if (method === 'PUT') {
              let res = await fetch(
                `/api/bracket/castGameVote?bracket_id=${settings.id}&game_key=${game.key}&participant_key=${player?.key}`,
                {
                  method: method,
                  headers: {
                    'Content-type': 'application/json',
                  },
                }
              );
              let newVote: CastGameVote = await res.json();
              setVotes((prev) => {
                if ('message' in newVote) {
                  return prev;
                } else {
                  let updatedVotes: Votes | undefined = JSON.parse(
                    JSON.stringify(prev)
                  );
                  if (updatedVotes === undefined) {
                    return prev;
                  } else {
                    const voteIndex = votes?.user.findIndex(
                      (vote) => vote.game_key === game.key
                    );
                    if (voteIndex > -1) {
                      updatedVotes.user[voteIndex] = newVote;
                    } else {
                      updatedVotes.user.push(newVote);
                    }
                    return updatedVotes;
                  }
                }
              });
              setVote(() => player?.key);
            }
          }}
        >
          <Typography>+Vote&nbsp;</Typography>
          <Typography>
            (
            {!('dummy' in game) && game.player_1 === player.key
              ? votes.games?.[game.key]?.player_1_votes
              : votes.games?.[game.key]?.player_2_votes}
            )
          </Typography>
        </Button>
      );
    } else {
      return <></>;
    }
  }

  function PickFields({
    player,
    otherPlayer,
  }: {
    player?: Participant;
    otherPlayer?: Participant;
  }) {
    if (
      player === undefined ||
      otherPlayer === undefined ||
      picks === undefined ||
      setPicks === undefined
    )
      return <></>;
    return (
      <>
        <Button
          fullWidth
          variant={pick === player?.key ? 'contained' : 'text'}
          disabled={disabledTest}
          onClick={async () => {
            let method;
            if (!pick || pick === otherPlayer?.key) method = 'PUT';
            else if (pick === player?.key) method = 'DELETE';

            if (method === 'DELETE') {
              setPicks((prev) => {
                let updatedPicks: (NewUserPick | UserPick)[][] = JSON.parse(
                  JSON.stringify(prev)
                );
                for (let r = roundIndex; r < updatedPicks.length; r++) {
                  for (let g = 0; g < updatedPicks[r].length; g++) {
                    if (updatedPicks[r][g].winner === player?.key) {
                      updatedPicks[r][g].winner = '';
                    }
                    if (r > roundIndex) {
                      if (updatedPicks[r][g].player_1 === player?.key) {
                        updatedPicks[r][g].player_1 = '';
                        updatedPicks[r][g].player_1_score = null;
                      }
                      if (updatedPicks[r][g].player_2 === player?.key) {
                        updatedPicks[r][g].player_2 = '';
                        updatedPicks[r][g].player_2_score = null;
                      }
                    }
                  }
                }
                return updatedPicks;
              });
              setPick(() => '');
            } else if (method === 'PUT') {
              setPicks((prev) => {
                let updatedPicks: (NewUserPick | UserPick)[][] = JSON.parse(
                  JSON.stringify(prev)
                );
                updatedPicks[roundIndex][gameIndex].winner = player?.key || '';
                if (
                  // Only update the next game if there is a next game
                  updatedPicks?.[roundIndex + 1]?.[Math.floor(gameIndex / 2)]
                ) {
                  updatedPicks[roundIndex + 1][
                    Math.floor(gameIndex / 2)
                  ].winner = '';
                  if (gameIndex % 2 === 0) {
                    updatedPicks[roundIndex + 1][
                      Math.floor(gameIndex / 2)
                    ].player_1 = player?.key || '';
                  } else {
                    updatedPicks[roundIndex + 1][
                      Math.floor(gameIndex / 2)
                    ].player_2 = player?.key || '';
                  }
                  if (
                    updatedPicks?.[roundIndex + 2]?.[Math.floor(gameIndex / 4)]
                  ) {
                    for (let r = roundIndex + 2; r < updatedPicks.length; r++) {
                      for (let g = 0; g < updatedPicks[r].length; g++) {
                        if (updatedPicks[r][g].winner === otherPlayer?.key) {
                          updatedPicks[r][g].winner = '';
                        }
                        if (updatedPicks[r][g].player_1 === otherPlayer?.key) {
                          updatedPicks[r][g].player_1 = '';
                        }
                        if (updatedPicks[r][g].player_2 === otherPlayer?.key) {
                          updatedPicks[r][g].player_2 = '';
                        }
                      }
                    }
                  }
                }
                return updatedPicks;
              });
              setPick(() => player?.key);
            }
          }}
        >
          Pick {player?.name}
        </Button>
      </>
    );
  }

  function Info({ info, game, player_1, player_2 }: InfoComponent) {
    function createUrl(website: string) {
      if (website.startsWith('http')) return website;
      else return `http://${website}`;
    }

    function TeamInfo({
      player_1,
      player_2,
    }: {
      player_1?: Participant | NewParticipant | undefined;
      player_2?: Participant | NewParticipant | undefined;
    }) {
      return (
        <Grid container>
          {/* Email */}
          {player_1?.email || player_2?.email ? (
            <>
              <Grid item xs={12} sx={{ backgroundColor: grey[100] }}>
                <Typography variant="h6" align="center">
                  Email
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  align="center"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}
                >
                  {player_1?.email && (
                    <MUILink href={`mailto:${player_1.email}`}>
                      {player_1.email}
                    </MUILink>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  align="center"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}
                >
                  {player_2?.email && (
                    <MUILink href={`mailto:${player_2.email}`}>
                      {player_2.email}
                    </MUILink>
                  )}
                </Typography>
              </Grid>
            </>
          ) : (
            <></>
          )}
          {/* Website */}
          {player_1?.website || player_2?.website ? (
            <>
              <Grid item xs={12} sx={{ backgroundColor: grey[100] }}>
                <Typography variant="h6" align="center">
                  Website
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  align="center"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}
                >
                  {player_1?.website && (
                    <MUILink href={createUrl(player_1.website)} target="_blank">
                      {player_1.website}
                    </MUILink>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  align="center"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}
                >
                  {player_2?.website && (
                    <MUILink href={createUrl(player_2.website)} target="_blank">
                      {player_2.website}
                    </MUILink>
                  )}
                </Typography>
              </Grid>
            </>
          ) : (
            <></>
          )}
          {/* Video */}
          {player_1?.video || player_2?.video ? (
            <>
              <Grid item xs={12} sx={{ backgroundColor: grey[100] }}>
                <Typography variant="h6" align="center">
                  Video
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  align="center"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}
                >
                  {player_1?.video && (
                    <MUILink href={createUrl(player_1.video)} target="_blank">
                      {player_1.video}
                    </MUILink>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  align="center"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}
                >
                  {player_2?.video && (
                    <MUILink href={createUrl(player_2.video)} target="_blank">
                      {player_2.video}
                    </MUILink>
                  )}
                </Typography>
              </Grid>
            </>
          ) : (
            <></>
          )}
          {/* Details */}
          {player_1?.details || player_2?.details ? (
            <>
              <Grid item xs={12} sx={{ backgroundColor: grey[100] }}>
                <Typography variant="h6" align="center">
                  Details
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  align="center"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}
                >
                  {player_1?.details && player_1.details}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  align="center"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}
                >
                  {player_2?.details && player_2.details}
                </Typography>
              </Grid>
            </>
          ) : (
            <></>
          )}
        </Grid>
      );
    }

    if (info === 'game') {
      return (
        <>
          {game?.details && (
            <Box sx={{ p: 3 }}>
              <Tiptap
                editable={false}
                placeholder="Details"
                content={game.details}
              />
            </Box>
          )}
        </>
      );
    } else if (info === 'team') {
      return <TeamInfo player_1={player_1} player_2={player_2} />;
    } else return <></>;
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="bracket-modal-title"
      // aria-describedby="update your bracket"
      sx={{
        // Used to center modal content with scrollable overflow
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        '.MuiModal-root:focus-visible': { outline: 'none' },
      }}
    >
      {/* Container and Paper start */}
      <Container maxWidth="sm" sx={{ maxHeight: '90%' }}>
        <Paper
          sx={{
            height: '100%', // Used for overflow
            padding: 0,
          }}
        >
          <Stack
            sx={{
              height: '100%', // Used for overflow
            }}
          >
            <Stack direction="row">
              {/* Close button */}
              <IconButton sx={{ alignSelf: 'center' }} onClick={handleClose}>
                <CloseIcon />
              </IconButton>
              {/* "Edit Profile" text */}
              <Typography
                id="bracket-modal-title"
                sx={{ flexGrow: 1, alignSelf: 'center' }}
              >
                {settings.bracket_type.includes('voting')
                  ? 'cast your vote'
                  : 'make your pick'}
              </Typography>
              <IconButton
                sx={{ alignSelf: 'center' }}
                disabled={roundIndex === 0 && gameIndex === 0}
                onClick={() => {
                  if (gameIndex === 0) {
                    setRoundIndex(() => roundIndex - 1);
                    setGameIndex(
                      () => rounds[roundIndex - 1].games?.length - 1
                    );
                  } else {
                    setGameIndex(() => gameIndex - 1);
                  }
                }}
              >
                <NavigateBeforeIcon />
              </IconButton>
              <IconButton
                sx={{ alignSelf: 'center' }}
                disabled={roundIndex === rounds?.length - 1 && gameIndex === 0}
                onClick={() => {
                  if (gameIndex === rounds?.[roundIndex]?.games?.length - 1) {
                    setRoundIndex(() => roundIndex + 1);
                    setGameIndex(() => 0);
                  } else {
                    setGameIndex(() => gameIndex + 1);
                  }
                }}
              >
                <NavigateNextIcon />
              </IconButton>
            </Stack>
            <Divider />
            {!('dummy' in game) && (
              <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {game?.time && (
                  <Box
                    sx={{
                      backgroundColor: grey[400],
                    }}
                  >
                    <Typography variant="h6" align="center">
                      {format(new Date(game.time), 'MM/dd/yyyy @hh:mm a z')}
                    </Typography>
                  </Box>
                )}
                {game?.location && (
                  <>
                    {game?.location?.place_id && (
                      <Stack
                        direction="row"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <PlaceIcon />
                        <MUILink
                          href={`https://www.google.com/maps/place/?q=place_id:${game.location.place_id}`}
                          target="_blank"
                        >
                          {game.location.name ||
                            game.location.formatted_address ||
                            game.location.locality}
                        </MUILink>
                      </Stack>
                    )}
                  </>
                )}

                <Grid container>
                  <Grid item xs={6}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        px: 3,
                        py: 1,
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {player_1?.name || 'TBD'}
                    </Typography>
                    <Box
                      sx={{
                        position: 'relative',
                        aspectRatio: '16 / 10',
                        backgroundColor: grey[400],
                      }}
                    >
                      {player_1?.image && (
                        <Image
                          src={`${player_1?.image || ''}`}
                          alt={`${player_1?.name || ''}`}
                          fill
                          unoptimized={true}
                          style={{
                            objectFit: 'cover',
                            objectPosition: 'center',
                          }}
                        />
                      )}
                    </Box>

                    {
                      // Check if single elimination
                      (settings.bracket_type === 'single-elimination' ||
                        settings.bracket_type ===
                          'single-elimination-rounds') &&
                        // Check if picks & setPicks available
                        picks !== undefined &&
                        setPicks !== undefined &&
                        // Only show if both winners from previous round have been picked
                        // OR if there is no previous round
                        (!picks?.[roundIndex - 1] ||
                          (picks?.[roundIndex - 1]?.[gameIndex * 2]?.winner &&
                            picks?.[roundIndex - 1]?.[gameIndex * 2 + 1]
                              ?.winner)) && (
                          <>
                            {player_1 &&
                              'id' in player_1 &&
                              player_2 &&
                              'id' in player_2 && (
                                <PickFields
                                  player={player_1}
                                  otherPlayer={player_2}
                                />
                              )}
                            {/* Player 1 Score */}
                            {rounds.length - 1 === roundIndex && (
                              <Box sx={{ p: 1 }}>
                                <TextField
                                  type="number"
                                  fullWidth={true}
                                  label="P1 Score"
                                  // variant="standard"
                                  value={player_1_score}
                                  onChange={(e) => {
                                    setPlayer_1_score(() => e.target.value);
                                    clearTimeout(timeoutRef.current);
                                    timeoutRef.current = setTimeout(() => {
                                      setPicks((prev) => {
                                        let updatedPicks: (
                                          | NewUserPick
                                          | UserPick
                                        )[][] = JSON.parse(
                                          JSON.stringify(prev)
                                        );
                                        updatedPicks[roundIndex][
                                          gameIndex
                                        ].player_1_score = Number(
                                          e.target.value
                                        );
                                        return updatedPicks;
                                      });
                                    }, 500);
                                  }}
                                />
                              </Box>
                            )}
                          </>
                        )
                    }

                    {/* Some of this might be redundant checking */}
                    {settings.bracket_type === 'single-elimination-voting' &&
                      game.player_1 &&
                      game.player_2 && (
                        <>
                          {/* This is definitely needed by typescript */}
                          {player_1 &&
                            'id' in player_1 &&
                            player_2 &&
                            'id' in player_2 && (
                              <VoteButton
                                player={player_1}
                                otherPlayer={player_2}
                              />
                            )}
                        </>
                      )}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        px: 3,
                        py: 1,
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {player_2?.name || 'TBD'}
                    </Typography>
                    <Box
                      sx={{
                        position: 'relative',
                        aspectRatio: '16 / 10',
                        backgroundColor: grey[300],
                      }}
                    >
                      {player_2?.image && (
                        <Image
                          src={`${player_2?.image || ''}`}
                          alt={`${player_2?.name || ''}`}
                          fill
                          unoptimized={true}
                          style={{
                            objectFit: 'cover',
                            objectPosition: 'center',
                          }}
                        />
                      )}
                    </Box>

                    {
                      // Check if single elimination
                      (settings.bracket_type === 'single-elimination' ||
                        settings.bracket_type ===
                          'single-elimination-rounds') &&
                        // Check if picks & setPicks available
                        picks !== undefined &&
                        setPicks !== undefined &&
                        // Only show if both winners from previous round have been picked
                        // OR if there is no previous round
                        (!picks?.[roundIndex - 1] ||
                          (picks?.[roundIndex - 1]?.[gameIndex * 2]?.winner &&
                            picks?.[roundIndex - 1]?.[gameIndex * 2 + 1]
                              ?.winner)) && (
                          <>
                            {player_1 &&
                              'id' in player_1 &&
                              player_2 &&
                              'id' in player_2 && (
                                <PickFields
                                  player={player_2}
                                  otherPlayer={player_1}
                                />
                              )}
                            {/* Player 2 Score */}
                            {rounds.length - 1 === roundIndex && (
                              <Box sx={{ p: 1 }}>
                                <TextField
                                  type="number"
                                  fullWidth={true}
                                  label="P2 Score"
                                  // variant="standard"
                                  value={player_2_score}
                                  onChange={(e) => {
                                    setPlayer_2_score(() => e.target.value);
                                    clearTimeout(timeoutRef.current);
                                    timeoutRef.current = setTimeout(() => {
                                      setPicks((prev) => {
                                        let updatedPicks: (
                                          | NewUserPick
                                          | UserPick
                                        )[][] = JSON.parse(
                                          JSON.stringify(prev)
                                        );
                                        updatedPicks[roundIndex][
                                          gameIndex
                                        ].player_2_score = Number(
                                          e.target.value
                                        );
                                        return updatedPicks;
                                      });
                                    }, 500);
                                  }}
                                />
                              </Box>
                            )}
                          </>
                        )
                    }

                    {settings.bracket_type === 'single-elimination-voting' &&
                      game.player_1 &&
                      game.player_2 && (
                        <>
                          {player_1 &&
                            'id' in player_1 &&
                            player_2 &&
                            'id' in player_2 && (
                              <VoteButton
                                player={player_2}
                                otherPlayer={player_1}
                              />
                            )}
                        </>
                      )}
                  </Grid>
                </Grid>
                <Stack direction="row">
                  <Button
                    fullWidth
                    color="secondary"
                    variant={info === 'game' ? 'contained' : 'outlined'}
                    onClick={() => setInfo('game')}
                  >
                    Game Info
                  </Button>
                  <Button
                    fullWidth
                    color="secondary"
                    variant={info === 'game' ? 'outlined' : 'contained'}
                    onClick={() => setInfo('team')}
                  >
                    Team Info
                  </Button>
                </Stack>
                <Info
                  info={info}
                  game={game}
                  player_1={player_1}
                  player_2={player_2}
                />
              </Box>
            )}
          </Stack>
        </Paper>
      </Container>
    </Modal>
  );
}
