import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useContext,
  useMemo,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

// Utils
import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import { getSlug } from './components/settings';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import { useSnackbarContext } from '../../common/contexts/mui';

// Mui Colors
import { grey } from '@mui/material/colors';

// MUI
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  Link as MUILink,
  ListItem,
  Menu,
  MenuItem,
  Modal,
  Paper,
  Snackbar,
  Stack,
  Toolbar,
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
  NewParticipantObject,
  ParticipantsState,
  SetParticipants,
  SettingsState,
  SetSettings,
  NewBracketState,
  SetRounds,
} from '.';

type NewBracketModalProps = {
  open: boolean;
  handleClose: () => void;
  newParticipantObject: NewParticipantObject;
  participants: ParticipantsState;
  setParticipants: SetParticipants;
  settings: SettingsState;
  setSettings: SetSettings;
  newBracket: NewBracketState;
  setRounds: SetRounds;
};

// ################################################
// ################################################
// ################ FUNCTION START ################
// ################################################
// ################################################

export default function NewBracketModal({
  open,
  handleClose,
  newParticipantObject,
  participants,
  setParticipants,
  settings,
  setSettings,
  newBracket,
  setRounds,
}: NewBracketModalProps) {
  const router = useRouter();

  const theme = useTheme();

  const [bracketName, setBracketName] = useState(settings.name);

  const [participantsField, setParticipantsField] = useState(() => {
    let namesArray = [];
    for (let i = 0; i < participants.length; i++) {
      namesArray.push(participants[i].name);
    }
    return namesArray.join('\n');
  });

  const snackbar = useSnackbarContext();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="bracket-setup-modal"
      aria-describedby="quick setup"
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
                id="bracket-setup-modal"
                sx={{ flexGrow: 1, alignSelf: 'center' }}
              >
                Quick setup
              </Typography>
            </Stack>
            <Divider />
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              <Stack
                component="form"
                spacing={2}
                sx={{
                  height: '100%', // Used for overflow
                }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSettings((prev) => {
                    let updatedSettings = { ...prev };
                    updatedSettings.name = bracketName;
                    updatedSettings.slug = getSlug(bracketName);
                    return updatedSettings;
                  });
                  setParticipants((prev) => {
                    let updatedParticipants = [...prev];
                    updatedParticipants = participantsField
                      .split('\n')
                      .map((name) => {
                        return newParticipantObject(name);
                      });
                    setRounds(() => [
                      ...newBracket.rounds(updatedParticipants),
                    ]);
                    return updatedParticipants;
                  });
                  handleClose();
                }}
              >
                {/* Bracket name */}
                <TextField
                  type="text"
                  required={true}
                  autoFocus={true}
                  fullWidth={true}
                  error={bracketName ? false : true}
                  label={bracketName ? 'Bracket name' : 'Required'}
                  variant="standard"
                  value={bracketName}
                  onChange={(e) => {
                    setBracketName(e.target.value);
                  }}
                />
                <TextField
                  id="bracket-participants-text-field"
                  error={
                    participantsField.split('\n').length < 2 ? true : false
                  }
                  label={
                    participantsField.split('\n').length < 2
                      ? 'Minimum 2'
                      : 'Participants'
                  }
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={16}
                  value={participantsField}
                  onChange={(e) => {
                    setParticipantsField(e.target.value);
                  }}
                />
                <Button
                  fullWidth={true}
                  variant="outlined"
                  type="submit"
                  disabled={
                    bracketName === '' ||
                    participantsField.split('\n').length < 2
                  }
                >
                  Start Editing
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Modal>
  );
}
