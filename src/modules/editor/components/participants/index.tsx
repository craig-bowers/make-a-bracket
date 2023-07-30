import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';

// MUI Theme
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSnackbarContext } from '../../../../common/contexts/mui';

// MUI
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  FormGroup,
  Grid,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material';

// Material Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import { URL_REGEX, EMAIL_REGEX } from '../../../../common/regExp';

// Types
import type {
  Participant,
  NewParticipant,
} from '../../../../common/types/bracket';
import type {
  ParticipantsState,
  SetParticipants,
  NewParticipantObject,
  NewBracketState,
  SetRounds,
} from '../..';

type Expanded = string | false;
type SetExpanded = React.Dispatch<React.SetStateAction<Expanded>>;
type HandleChange = (
  panel: string
) => (event: React.SyntheticEvent, isExpanded: boolean) => void;

type ParticipantsProps = {
  participants: ParticipantsState;
  setParticipants: SetParticipants;
  newParticipantObject: NewParticipantObject;
  newBracket: NewBracketState;
  setRounds: SetRounds;
};

type ParticipantAccordionProps = {
  participant: Participant | NewParticipant;
  index: number;
  setParticipants: SetParticipants;
  newBracket: NewBracketState;
  setRounds: SetRounds;
  expanded: Expanded;
  setExpanded: SetExpanded;
  handleChange: HandleChange;
};

function ParticipantAccordion({
  participant,
  index,
  setParticipants,
  newBracket,
  setRounds,
  expanded,
  setExpanded,
  handleChange,
}: ParticipantAccordionProps) {
  const router = useRouter();
  const snackbar = useSnackbarContext();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [name, setName] = useState<string>(participant?.name || '');
  const [ranking, setRanking] = useState<number | string>(
    participant?.ranking || ''
  );
  const [image, setImage] = useState<string>(participant?.image || '');
  const [email, setEmail] = useState<string>(participant?.email || '');
  const [website, setWebsite] = useState<string>(participant?.website || '');
  const [video, setVideo] = useState<string>(participant?.video || '');
  const [details, setDetails] = useState<string>(participant?.details || '');

  return (
    <Accordion
      expanded={expanded === `participant${index}`}
      onChange={handleChange(`participant${index}`)}
    >
      <Box sx={{ position: 'relative', display: 'block' }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`participant${index}-content`}
          id={`participant${index}-header`}
          sx={{
            '.MuiAccordionSummary-content': {
              overflow: 'hidden',
            },
          }}
        >
          <Typography
            sx={{
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              width: '85%',
            }}
          >
            {name}
          </Typography>
        </AccordionSummary>
        <IconButton
          sx={{
            position: 'absolute',
            right: '15%',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          onClick={() => {
            setParticipants((prev) => {
              let updatedParticipants = [
                ...prev.slice(0, index),
                ...prev.slice(index + 1, prev.length),
              ];
              setRounds(() => [...newBracket.rounds(updatedParticipants)]);
              return updatedParticipants;
            });
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
      <AccordionDetails>
        {/* Save Button */}
        {router.pathname.endsWith('/edit') && (
          <Button
            fullWidth
            variant="contained"
            sx={{ mb: 1 }}
            onClick={async (e) => {
              let res = await fetch('/api/bracket/edit/participant', {
                method: 'PUT',
                headers: {
                  'Content-type': 'application/json',
                },
                body: JSON.stringify({
                  participant,
                }),
              });
              setExpanded(false);
              if (res.status === 200) {
                snackbar.pushSnack({
                  children: (
                    <Alert
                      variant="filled"
                      onClose={snackbar.handleClose}
                      severity="success"
                      // sx={{ width: '100%' }}
                    >
                      Participant updated.
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
                      Could not update participant.
                    </Alert>
                  ),
                });
              }
            }}
          >
            Save
          </Button>
        )}
        {/* Name */}
        <TextField
          type="text"
          fullWidth={true}
          label="Name"
          variant="standard"
          value={name}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setName(() => e.target.value);
            timeoutRef.current = setTimeout(() => {
              setParticipants((prev) => {
                prev[index].name = e.target.value;
                return [...prev];
              });
            }, 500);
          }}
        />
        {/* Ranking */}
        <TextField
          type="number"
          fullWidth={true}
          label="Ranking"
          variant="standard"
          value={ranking}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setRanking(parseInt(e.target.value) || '');
            timeoutRef.current = setTimeout(() => {
              setParticipants((prev) => {
                prev[index].ranking = parseInt(e.target.value) || null;
                return [...prev];
              });
            }, 500);
          }}
        />
        {/* Image */}
        <TextField
          type="url"
          fullWidth={true}
          label="Image URL"
          variant="standard"
          value={image}
          // onBlur={(e) => {
          //   const matchedUrl =
          //     e.target.value.match(URL_REGEX)?.[0].trim() || '';
          //   setImage(() => matchedUrl);
          //   setParticipants((prev) => {
          //     prev[index].image = matchedUrl;
          //     return [...prev];
          //   });
          // }}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setImage(() => e.target.value);
            timeoutRef.current = setTimeout(() => {
              setParticipants((prev) => {
                prev[index].image = e.target.value;
                return [...prev];
              });
            }, 500);
          }}
        />
        {/* Email */}
        <TextField
          type="text"
          fullWidth={true}
          label="Email"
          variant="standard"
          value={email}
          // onBlur={(e) => {
          //   const matchedUrl =
          //     e.target.value.match(EMAIL_REGEX)?.[0].trim() || '';
          //   setEmail(() => matchedUrl);
          //   setParticipants((prev) => {
          //     prev[index].email = matchedUrl;
          //     return [...prev];
          //   });
          // }}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setEmail(() => e.target.value);
            timeoutRef.current = setTimeout(() => {
              setParticipants((prev) => {
                prev[index].email = e.target.value;
                return [...prev];
              });
            }, 500);
          }}
        />
        {/* Website */}
        <TextField
          type="url"
          fullWidth={true}
          label="Website"
          variant="standard"
          value={website}
          // onBlur={(e) => {
          //   const matchedUrl =
          //     e.target.value.match(URL_REGEX)?.[0].trim() || '';
          //   setWebsite(() => matchedUrl);
          //   setParticipants((prev) => {
          //     prev[index].website = matchedUrl;
          //     return [...prev];
          //   });
          // }}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setWebsite(() => e.target.value);
            timeoutRef.current = setTimeout(() => {
              setParticipants((prev) => {
                prev[index].website = e.target.value;
                return [...prev];
              });
            }, 500);
          }}
        />
        {/* Video */}
        <TextField
          type="url"
          fullWidth={true}
          label="Video URL"
          variant="standard"
          value={video}
          // onBlur={(e) => {
          //   const matchedUrl =
          //     e.target.value.match(URL_REGEX)?.[0].trim() || '';
          //   setVideo(() => matchedUrl);
          //   setParticipants((prev) => {
          //     prev[index].video = matchedUrl;
          //     return [...prev];
          //   });
          // }}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setVideo(() => e.target.value);
            timeoutRef.current = setTimeout(() => {
              setParticipants((prev) => {
                prev[index].video = e.target.value;
                return [...prev];
              });
            }, 500);
          }}
        />
        {/* Details */}
        <TextField
          type="text"
          fullWidth={true}
          label="Details"
          variant="standard"
          multiline
          maxRows={4}
          value={details}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setDetails(() => e.target.value);
            timeoutRef.current = setTimeout(() => {
              setParticipants((prev) => {
                prev[index].details = e.target.value;
                return [...prev];
              });
            }, 500);
          }}
        />
      </AccordionDetails>
    </Accordion>
  );
}

export default function Participants({
  participants,
  setParticipants,
  newParticipantObject,
  newBracket,
  setRounds,
}: ParticipantsProps) {
  const router = useRouter();
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));

  const [expanded, setExpanded] = useState<Expanded>(false);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <>
      {participants.map((participant, index) => {
        return (
          <ParticipantAccordion
            key={participant.key}
            participant={participant}
            index={index}
            setParticipants={setParticipants}
            newBracket={newBracket}
            setRounds={setRounds}
            expanded={expanded}
            setExpanded={setExpanded}
            handleChange={handleChange}
          />
        );
      })}
      {router.pathname.startsWith('/new') && (
        <Button
          variant="contained"
          onClick={() => {
            setParticipants((prev) => {
              let updatedParticipants = [
                ...prev,
                newParticipantObject(prev.length + 1),
              ];
              setRounds(() => [...newBracket.rounds(updatedParticipants)]);
              return updatedParticipants;
            });
          }}
        >
          Add Participant
        </Button>
      )}
    </>
  );
}
