import { useState, useEffect, useRef, Fragment } from 'react';

// Tiptap
import Tiptap from '../../../../common/components/Tiptap';

import { useRouter } from 'next/router';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSnackbarContext } from '../../../../common/contexts/mui';

// Dates
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

// MUI
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Button,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  TextField,
} from '@mui/material';

// Material Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GoogleIcon from '@mui/icons-material/Google';

// Types
import type {
  Settings,
  NewSettings,
  Round,
  NewRound,
  Game,
  NewGame,
  Participant,
  NewParticipant,
  Location,
} from '../../../../common/types/bracket';
import type { SetParticipants, RoundsState, SetRounds } from '../..';
type Expanded = string | false;
type RoundAccordionProps = {
  settings: Settings | NewSettings;
  round: Round | NewRound;
  roundIndex: number;
  setRounds: SetRounds;
  expanded: Expanded;
  handleChange: (
    panel: string
  ) => (event: React.SyntheticEvent, newExpanded: boolean) => void;
};
type GameAccordionProps = {
  settings: Settings | NewSettings;
  roundIndex: number;
  gameIndex: number;
  game: Game | NewGame;
  participants: (Participant | NewParticipant)[];
  setParticipants: SetParticipants;
  rounds: Round[] | NewRound[];
  setRounds: SetRounds;
  expanded: Expanded;
  handleChange: (
    panel: string
  ) => (event: React.SyntheticEvent, newExpanded: boolean) => void;
};
type GamesComponentProps = {
  settings: Settings | NewSettings;
  participants: (Participant | NewParticipant)[];
  setParticipants: SetParticipants;
  rounds: Round[] | NewRound[];
  setRounds: SetRounds;
};

function RoundAccordion({
  settings,
  round,
  roundIndex,
  setRounds,
  expanded,
  handleChange,
}: RoundAccordionProps) {
  const [roundName, setRoundName] = useState(() => round?.name);
  const [timestampStart, setTimestampStart] = useState(() =>
    round?.timestamp_start ? new Date(round.timestamp_start) : null
  );
  const [timestampEnd, setTimestampEnd] = useState(() =>
    round?.timestamp_end ? new Date(round.timestamp_end) : null
  );
  const [ppg, setPpg] = useState(() => round?.ppg || '1');

  const timeoutRef = useRef<NodeJS.Timeout>();

  return (
    <Accordion
      expanded={expanded === `round-${roundIndex + 1}`}
      onChange={handleChange(`round-${roundIndex + 1}`)}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`round-${roundIndex + 1}-content`}
        id={`round-${roundIndex + 1}-header`}
        sx={{
          '.MuiAccordionSummary-content': {
            overflow: 'hidden',
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {round?.name}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={3}>
          {/* Name */}
          <TextField
            type="text"
            fullWidth={true}
            label="Name"
            value={roundName}
            onChange={(e) => {
              clearTimeout(timeoutRef.current);
              setRoundName(() => e.target.value);
              timeoutRef.current = setTimeout(() => {
                setRounds((prev) => {
                  let updatedRounds: RoundsState = JSON.parse(
                    JSON.stringify(prev)
                  );
                  updatedRounds[roundIndex].name = e.target.value;
                  return updatedRounds;
                });
              }, 500);
            }}
          />

          {/* Start Time (Voting, etc) */}
          {(settings?.bracket_type === 'single-elimination-rounds' ||
            settings?.bracket_type === 'single-elimination-voting') && (
            <DateTimePicker
              label="Start Time"
              // inputFormat="MM/dd/yyyy"
              value={timestampStart}
              onChange={(dateObj) => {
                clearTimeout(timeoutRef.current);
                setTimestampStart(() => dateObj);
                timeoutRef.current = setTimeout(() => {
                  setRounds((prev) => {
                    let updatedRounds: RoundsState = JSON.parse(
                      JSON.stringify(prev)
                    );
                    updatedRounds[roundIndex].timestamp_start =
                      dateObj?.toUTCString() || null;
                    return updatedRounds;
                  });
                }, 500);
              }}
              slotProps={{
                textField: {
                  error:
                    !!timestampStart &&
                    !!timestampEnd &&
                    timestampStart > timestampEnd
                      ? true
                      : false,
                  label:
                    !!timestampStart &&
                    !!timestampEnd &&
                    timestampStart > timestampEnd
                      ? 'Start Time must be before End Time'
                      : 'Start Time',
                },
              }}
            />
          )}

          {/* End Time (Voting, etc) */}
          {(settings?.bracket_type === 'single-elimination-rounds' ||
            settings?.bracket_type === 'single-elimination-voting') && (
            <DateTimePicker
              label="End Time"
              // inputFormat="MM/dd/yyyy"
              value={timestampEnd}
              onChange={(dateObj) => {
                clearTimeout(timeoutRef.current);
                setTimestampEnd(() => dateObj);
                timeoutRef.current = setTimeout(() => {
                  setRounds((prev) => {
                    let updatedRounds: RoundsState = JSON.parse(
                      JSON.stringify(prev)
                    );
                    updatedRounds[roundIndex].timestamp_end =
                      dateObj?.toUTCString() || null;
                    return updatedRounds;
                  });
                }, 500);
              }}
              slotProps={{
                textField: {
                  error:
                    !!timestampStart &&
                    !!timestampEnd &&
                    timestampStart > timestampEnd
                      ? true
                      : false,
                  label:
                    !!timestampStart &&
                    !!timestampEnd &&
                    timestampStart > timestampEnd
                      ? 'End Time must be after Start Time'
                      : 'End Time',
                },
              }}
            />
          )}

          {/* Points per game */}
          <TextField
            type="number"
            fullWidth={true}
            label="Points Per Game"
            // variant="standard"
            value={ppg}
            onChange={(e) => {
              let newPpg: string;
              if (
                Number.isInteger(Number(e.target.value)) === false ||
                Number(e.target.value) <= 0
              ) {
                newPpg = '1';
              } else {
                newPpg = e.target.value;
              }
              clearTimeout(timeoutRef.current);
              setPpg(() => newPpg);
              timeoutRef.current = setTimeout(() => {
                setRounds((prev) => {
                  let updatedRounds: RoundsState = JSON.parse(
                    JSON.stringify(prev)
                  );
                  updatedRounds[roundIndex].ppg = Number(newPpg) || null;
                  return updatedRounds;
                });
              }, 500);
            }}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function GameAccordion({
  settings,
  roundIndex,
  gameIndex,
  game,
  participants,
  setParticipants,
  rounds,
  setRounds,
  expanded,
  handleChange,
}: GameAccordionProps) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [player1, setPlayer1] = useState(() =>
    participants.find((participant) => participant.key === game.player_1)
  );
  const [player2, setPlayer2] = useState(() =>
    participants.find((participant) => participant.key === game.player_2)
  );
  const [winner, setWinner] = useState(() => game?.winner || '');
  const [player1Score, setPlayer1Score] = useState(
    () => game?.player_1_score || ''
  );
  const [player2Score, setPlayer2Score] = useState(
    () => game?.player_2_score || ''
  );
  const [gameTime, setGameTime] = useState(() =>
    game?.time ? new Date(game.time) : null
  );
  // const [location, setLocation] = useState(() => game?.location || '');
  const [details, setDetails] = useState(() => game?.details || null);

  useEffect(() => {
    setPlayer1(() =>
      participants.find((participant) => participant.key === game.player_1)
    );
    setPlayer2(() =>
      participants.find((participant) => participant.key === game.player_2)
    );
    setWinner(() => game?.winner || '');
    setPlayer1Score(() => game?.player_1_score || '');
    setPlayer2Score(() => game?.player_2_score || '');
    setGameTime(() => (game?.time ? new Date(game.time) : null));
    // setLocation(() => game?.location || '');
    setDetails(() => game?.details || null);
  }, [game, participants]);

  // Google Maps
  const [locationSuggestions, setLocationSuggestions] = useState<
    google.maps.places.QueryAutocompletePrediction[]
  >([]);
  const [location, setLocation] = useState<
    google.maps.places.QueryAutocompletePrediction | string | null
  >(game?.location?.name || game?.location?.formatted_address || null);
  const [locationInput, setLocationInput] = useState('');
  const [sessionToken, setSessionToken] = useState<
    google.maps.places.AutocompleteSessionToken | undefined
  >();
  const locationRef = useRef();

  // useEffect(() => {
  //   if (!sessionToken) {
  //     setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
  //   }
  // }, [sessionToken]);

  return (
    <Accordion
      expanded={expanded === `round-${roundIndex + 1}-game-${gameIndex + 1}`}
      onChange={handleChange(`round-${roundIndex + 1}-game-${gameIndex + 1}`)}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`round-${roundIndex + 1}-game-${gameIndex + 1}-content`}
        id={`round-${roundIndex + 1}-game-${gameIndex + 1}-header`}
      >
        <Typography>{game.name}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={3}>
          {/* Player 1 */}
          <FormControl fullWidth>
            <InputLabel id={`${game.key}-player1-select-label`}>
              Player 1
            </InputLabel>
            <Select
              disabled={'id' in settings}
              labelId={`${game.key}-player1-select-label`}
              id={`${game.key}-player1-select`}
              value={player1?.key || ''}
              label="Player 1"
              onChange={(e) => {
                clearTimeout(timeoutRef.current);
                let originalP1 = player1;
                let updatedP1 = participants.find(
                  (participant) => participant?.key === e.target.value
                );
                timeoutRef.current = setTimeout(() => {
                  let originalIndex = participants.findIndex((participant) => {
                    return participant?.key === originalP1?.key;
                  });
                  let swapIndex = participants.findIndex((participant) => {
                    return participant?.key === updatedP1?.key;
                  });
                  if (originalIndex === -1 || swapIndex === -1) {
                    return setRounds((prev) => {
                      let updatedRounds: RoundsState = JSON.parse(
                        JSON.stringify(prev)
                      );
                      updatedRounds[roundIndex].games[gameIndex].player_1 =
                        e.target.value;
                      return updatedRounds;
                    });
                  }
                  setParticipants((prev) => {
                    let oldParticipants = prev.slice();
                    [
                      oldParticipants[originalIndex],
                      oldParticipants[swapIndex],
                    ] = [
                      oldParticipants[swapIndex],
                      oldParticipants[originalIndex],
                    ];
                    return oldParticipants;
                  });
                  setRounds((prev) => {
                    // Check all games and update appropriately
                    return prev.map((round, roundIndex) => {
                      let updatedGames = round.games.map((game, gameIndex) => {
                        let updatedGame = { ...game };
                        // These 4 tests are needed to check though the entire bracket
                        // Player 1 tests
                        if (updatedGame.player_1 === originalP1?.key) {
                          updatedGame.player_1 = e.target.value;
                        } else if (updatedGame.player_1 === e.target.value) {
                          updatedGame.player_1 = originalP1?.key || '';
                        }
                        // Player 2 tests
                        if (updatedGame.player_2 === originalP1?.key) {
                          updatedGame.player_2 = e.target.value;
                        } else if (updatedGame.player_2 === e.target.value) {
                          updatedGame.player_2 = originalP1?.key || '';
                        }
                        return updatedGame;
                      });
                      return { ...round, games: updatedGames };
                    });
                  });
                }, 500);
                setPlayer1(() => updatedP1);
                if (player2?.key === updatedP1?.key) {
                  setPlayer2(() => originalP1);
                }
              }}
            >
              <MenuItem value="">Select Player</MenuItem>
              {participants.map((participant) => {
                return (
                  <MenuItem
                    key={`game-${game.key}-player1-${participant?.key}`}
                    value={participant?.key || ''}
                  >
                    {participant?.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Player 2 */}
          <FormControl fullWidth>
            <InputLabel id={`${game.key}-player2-select-label`}>
              Player 2
            </InputLabel>
            <Select
              disabled={'id' in settings}
              labelId={`${game.key}-player2-select-label`}
              id={`${game.key}-player2-select`}
              value={player2?.key || ''}
              label="Player 2"
              onChange={(e) => {
                clearTimeout(timeoutRef.current);
                let originalP2 = player2;
                let updatedP2 = participants.find(
                  (participant) => participant?.key === e.target.value
                );
                timeoutRef.current = setTimeout(() => {
                  let originalIndex = participants.findIndex((participant) => {
                    return participant?.key === originalP2?.key;
                  });
                  let swapIndex = participants.findIndex((participant) => {
                    return participant?.key === updatedP2?.key;
                  });
                  if (originalIndex === -1 || swapIndex === -1) {
                    return setRounds((prev) => {
                      let updatedRounds: RoundsState = JSON.parse(
                        JSON.stringify(prev)
                      );
                      updatedRounds[roundIndex].games[gameIndex].player_2 =
                        e.target.value;
                      return updatedRounds;
                    });
                  }
                  setParticipants((prev) => {
                    let oldParticipants = prev.slice();
                    [
                      oldParticipants[originalIndex],
                      oldParticipants[swapIndex],
                    ] = [
                      oldParticipants[swapIndex],
                      oldParticipants[originalIndex],
                    ];
                    return oldParticipants;
                  });
                  setRounds((prev) => {
                    return prev.map((round) => {
                      let updatedGames = round.games.map((game) => {
                        let updatedGame = { ...game };
                        // These 4 tests are needed to check though the entire bracket
                        // Player 2 tests
                        if (updatedGame.player_2 === originalP2?.key) {
                          updatedGame.player_2 = e.target.value || '';
                        } else if (updatedGame.player_2 === e.target.value) {
                          updatedGame.player_2 = originalP2?.key || '';
                        }
                        // Player 1 tests
                        if (updatedGame.player_1 === originalP2?.key) {
                          updatedGame.player_1 = e.target.value || '';
                        } else if (updatedGame.player_1 === e.target.value) {
                          updatedGame.player_1 = originalP2?.key || '';
                        }
                        return updatedGame;
                      });
                      return { ...round, games: updatedGames };
                    });
                  });
                }, 500);
                setPlayer2(() => updatedP2);
                if (player1?.key === updatedP2?.key) {
                  setPlayer1(() => originalP2);
                }
              }}
            >
              <MenuItem value="">Select Player</MenuItem>
              {participants.map((participant) => {
                return (
                  <MenuItem
                    key={`game-${game.key}-player1-${participant?.key}`}
                    value={participant?.key || ''}
                  >
                    {participant?.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Winner */}
          <FormControl fullWidth>
            <InputLabel id={`${game.key}-winner-select-label`}>
              Winner
            </InputLabel>
            <Select
              labelId={`${game.key}-winner-select-label`}
              id={`${game.key}-winner-select`}
              value={
                ['', game?.player_1, game?.player_2].includes(winner)
                  ? winner
                  : ''
              }
              label="Winner"
              onChange={(e) => {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                  setRounds((prev) => {
                    let updatedRounds: RoundsState = JSON.parse(
                      JSON.stringify(prev)
                    );
                    updatedRounds[roundIndex].games[gameIndex].winner =
                      e.target.value;
                    // Check to see if there's a next game
                    if (
                      updatedRounds?.[roundIndex + 1]?.games?.[
                        Math.floor(gameIndex / 2)
                      ]
                    ) {
                      // Update appropriate player slot
                      if (gameIndex % 2 === 0) {
                        updatedRounds[roundIndex + 1].games[
                          Math.floor(gameIndex / 2)
                        ].player_1 = e.target.value;
                      } else {
                        updatedRounds[roundIndex + 1].games[
                          Math.floor(gameIndex / 2)
                        ].player_2 = e.target.value;
                      }
                      updatedRounds[roundIndex + 1].games[
                        Math.floor(gameIndex / 2)
                      ].winner = '';
                    }
                    if (updatedRounds?.[roundIndex + 2]) {
                      for (
                        let r = roundIndex + 2;
                        r <= updatedRounds.length;
                        r++
                      ) {
                        for (
                          let g = 0;
                          g < updatedRounds?.[r]?.games?.length;
                          g++
                        ) {
                          if (
                            updatedRounds?.[r]?.games?.[g]?.winner === winner
                          ) {
                            updatedRounds[r].games[g].winner = '';
                          }
                          if (
                            updatedRounds?.[r]?.games?.[g]?.player_1 === winner
                          ) {
                            updatedRounds[r].games[g].player_1 = '';
                          }
                          if (
                            updatedRounds?.[r]?.games?.[g]?.player_2 === winner
                          ) {
                            updatedRounds[r].games[g].player_2 = '';
                          }
                        }
                      }
                    }
                    return updatedRounds;
                  });
                }, 500);
                // setWinner(() => e.target.value);
              }}
            >
              <MenuItem value="">Select Winner</MenuItem>
              {/* Only show options if game.player_1 and game.player_2 are not empty */}
              {game?.player_1 !== '' && game?.player_2 !== '' && (
                <MenuItem value={game?.player_1 || ''}>
                  {player1?.name}
                </MenuItem>
              )}
              {game?.player_1 !== '' && game?.player_2 !== '' && (
                <MenuItem value={game?.player_2 || ''}>
                  {player2?.name}
                </MenuItem>
              )}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={3}>
            {/* Player 1 Score */}
            <TextField
              type="number"
              fullWidth={true}
              label="P1 Score"
              // variant="standard"
              value={player1Score}
              onChange={(e) => {
                clearTimeout(timeoutRef.current);
                setPlayer1Score(() => e.target.value);
                timeoutRef.current = setTimeout(() => {
                  setRounds((prev) => {
                    let updatedRounds: RoundsState = JSON.parse(
                      JSON.stringify(prev)
                    );
                    updatedRounds[roundIndex].games[gameIndex].player_1_score =
                      Number(e.target.value) || null;
                    return updatedRounds;
                  });
                }, 500);
              }}
            />
            {/* Player 2 Score */}
            <TextField
              type="number"
              fullWidth={true}
              label="P2 Score"
              // variant="standard"
              value={player2Score}
              onChange={(e) => {
                clearTimeout(timeoutRef.current);
                setPlayer2Score(() => e.target.value);
                timeoutRef.current = setTimeout(() => {
                  setRounds((prev) => {
                    let updatedRounds: RoundsState = JSON.parse(
                      JSON.stringify(prev)
                    );
                    updatedRounds[roundIndex].games[gameIndex].player_2_score =
                      Number(e.target.value) || null;
                    return updatedRounds;
                  });
                }, 500);
              }}
            />
          </Stack>
          {/* Game Time */}
          <DateTimePicker
            label="Date & Time"
            // inputFormat="MM/dd/yyyy"
            value={gameTime}
            onChange={(dateObj) => {
              clearTimeout(timeoutRef.current);
              setGameTime(() => dateObj);
              timeoutRef.current = setTimeout(() => {
                setRounds((prev) => {
                  let updatedRounds: RoundsState = JSON.parse(
                    JSON.stringify(prev)
                  );
                  updatedRounds[roundIndex].games[gameIndex].time =
                    dateObj?.toUTCString() || null;
                  return updatedRounds;
                });
              }, 500);
            }}
          />
          {/* Location */}
          {/* <TextField
            type="text"
            fullWidth={true}
            label="Location"
            value={location}
            onChange={(e) => {
              clearTimeout(timeoutRef.current);
              setLocation(() => e.target.value);
              timeoutRef.current = setTimeout(() => {
                setRounds((prev) => {
                  let updatedRounds: RoundsState = JSON.parse(JSON.stringify(prev));
                  updatedRounds[roundIndex].games[gameIndex].location =
                    e.target.value;
                  return updatedRounds;
                });
              }, 500);
            }}
          /> */}

          {/* Location */}
          {/* Google Places Autocomplete */}
          <Autocomplete
            fullWidth
            freeSolo
            autoSelect
            blurOnSelect
            value={location}
            onChange={async (event, newValue) => {
              setLocation(() => newValue);
              if (
                typeof newValue === 'string' ||
                newValue === null ||
                newValue.place_id === undefined
              ) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                  setRounds((prev) => {
                    let updatedRounds: RoundsState = JSON.parse(
                      JSON.stringify(prev)
                    );
                    if (newValue === null) {
                      updatedRounds[roundIndex].games[gameIndex].location =
                        newValue;
                    } else if (typeof newValue === 'string') {
                      updatedRounds[roundIndex].games[gameIndex].location = {
                        name: newValue,
                      };
                    }
                    return updatedRounds;
                  });
                }, 500);
                return;
              }
              var request: google.maps.places.PlaceDetailsRequest = {
                sessionToken: sessionToken,
                placeId: newValue.place_id,
                fields: [
                  'name',
                  'place_id',
                  'address_component',
                  'formatted_address',
                ],
              };
              function callback(
                place: google.maps.places.PlaceResult | null,
                status: google.maps.places.PlacesServiceStatus
              ) {
                if (
                  status == window.google.maps.places.PlacesServiceStatus.OK
                ) {
                  if (!place || !place.place_id) return;

                  const details: Location = {
                    name: place.name,
                    place_id: place.place_id,
                    formatted_address: place.formatted_address,
                  };

                  place?.address_components?.forEach((component) => {
                    const componentType = component.types[0];

                    switch (componentType) {
                      case 'street_number':
                        details.street_number = component.long_name;
                        break;
                      case 'route':
                        details.route = component.long_name;
                        break;
                      case 'locality':
                        details.locality = component.long_name;
                        break;
                      case 'administrative_area_level_2':
                        details.administrative_area_level_2 =
                          component.long_name;
                        break;
                      case 'administrative_area_level_1':
                        details.administrative_area_level_1 =
                          component.long_name;
                        break;
                      case 'country':
                        details.country = component.long_name;
                        break;
                      case 'postal_code':
                        details.postal_code = component.long_name;
                        break;
                      default:
                        break;
                    }
                  });

                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = setTimeout(() => {
                    setRounds((prev) => {
                      let updatedRounds: RoundsState = JSON.parse(
                        JSON.stringify(prev)
                      );
                      updatedRounds[roundIndex].games[gameIndex].location =
                        details;
                      return updatedRounds;
                    });
                  }, 500);
                }
              }
              window.placesService.getDetails(request, callback);
              setSessionToken(undefined);
            }}
            inputValue={locationInput}
            onInputChange={(event, newInputValue) => {
              window.setLocationSuggestions = setLocationSuggestions;
              setLocation(() => null);
              setLocationInput(() => newInputValue);
              if (newInputValue === '') return;
              window.autocompleteService.getPlacePredictions(
                { input: newInputValue, sessionToken: sessionToken },
                window.displaySuggestions
              );
            }}
            id="bracketLocation"
            options={locationSuggestions}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Location"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <GoogleIcon />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            // renderOption={(props, option) => (
            //   <Box component="li" {...props}>
            //     option?.description
            //   </Box>
            // )}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              else return option.description || '';
            }}
            isOptionEqualToValue={(option, value) =>
              option.description === value.description
            }
          />

          <Tiptap
            editable={true}
            placeholder="Details"
            content={details}
            update={(content) => {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = setTimeout(() => {
                setRounds((prev) => {
                  let updatedRounds: RoundsState = JSON.parse(
                    JSON.stringify(prev)
                  );
                  updatedRounds[roundIndex].games[gameIndex].details = content;
                  return updatedRounds;
                });
              }, 500);
            }}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function Games({
  settings,
  participants,
  setParticipants,
  rounds,
  setRounds,
}: GamesComponentProps) {
  const router = useRouter();
  const snackbar = useSnackbarContext();
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));

  const [expanded, setExpanded] = useState<Expanded>('panel1');

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  return (
    <>
      {'id' in settings && (
        <Button
          fullWidth
          variant="contained"
          sx={{ mb: 1 }}
          onClick={async () => {
            let res = await fetch('/api/bracket/edit/rounds', {
              method: 'PUT',
              headers: {
                'Content-type': 'application/json',
              },
              body: JSON.stringify({
                rounds,
              }),
            });
            if (res.status === 200) {
              snackbar.pushSnack({
                children: (
                  <Alert
                    variant="filled"
                    onClose={snackbar.handleClose}
                    severity="success"
                    // sx={{ width: '100%' }}
                  >
                    Updated games.
                  </Alert>
                ),
              });
            } else {
              snackbar.pushSnack({
                children: (
                  <Alert
                    variant="filled"
                    onClose={snackbar.handleClose}
                    severity="error"
                    // sx={{ width: '100%' }}
                  >
                    Could not update games.
                  </Alert>
                ),
              });
            }
          }}
        >
          Save
        </Button>
      )}
      {rounds.map((round, roundIndex) => {
        return (
          <Fragment key={round.key}>
            {/* Round Settings */}
            <RoundAccordion
              settings={settings}
              round={round}
              roundIndex={roundIndex}
              setRounds={setRounds}
              expanded={expanded}
              handleChange={handleChange}
            />
            <Divider />
            {/* Games in round */}
            {round.games.map((game, gameIndex) => {
              return (
                <GameAccordion
                  key={game.key}
                  settings={settings}
                  roundIndex={roundIndex}
                  gameIndex={gameIndex}
                  game={game}
                  participants={participants}
                  setParticipants={setParticipants}
                  rounds={rounds}
                  setRounds={setRounds}
                  expanded={expanded}
                  handleChange={handleChange}
                />
              );
            })}
          </Fragment>
        );
      })}
    </>
  );
}
