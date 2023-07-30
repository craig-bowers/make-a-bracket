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
import { getSlug } from '.';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import { useSnackbarContext } from '../../../../common/contexts/mui';

// Mui Colors
import { grey } from '@mui/material/colors';

// MUI
import {
  Alert,
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
import { Settings } from '../../../../common/types/bracket';

type DeleteBracketModalProps = {
  open: boolean;
  handleClose: () => void;
  settings: Settings;
};

// ################################################
// ################################################
// ################ FUNCTION START ################
// ################################################
// ################################################

export default function DeleteBracketModal({
  open,
  handleClose,
  settings,
}: DeleteBracketModalProps) {
  const router = useRouter();
  const theme = useTheme();
  const snackbar = useSnackbarContext();
  const [confirmText, setConfirmText] = useState<string>('');

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
                sx={{
                  flexGrow: 1,
                  alignSelf: 'center',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                Delete <b>{settings.name}</b> bracket
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

                  let res = await fetch(`/api/bracket/delete/${settings.id}`, {
                    method: 'DELETE',
                    headers: {
                      'Content-type': 'application/json',
                    },
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
                          Bracket deleted.
                        </Alert>
                      ),
                    });
                    return router.replace('/');
                  } else {
                    snackbar.pushSnack({
                      children: (
                        <Alert
                          variant="filled"
                          onClose={snackbar.handleClose}
                          severity="error"
                          // sx={{ width: '100%' }}
                        >
                          Could not delete bracket.
                        </Alert>
                      ),
                    });
                  }
                  handleClose();
                }}
              >
                {/* Bracket name */}
                <TextField
                  type="text"
                  placeholder="DELETE"
                  required={true}
                  autoFocus={true}
                  fullWidth={true}
                  error={confirmText === 'DELETE' ? false : true}
                  label={
                    confirmText === 'DELETE'
                      ? 'Confirm'
                      : 'Type DELETE to confirm'
                  }
                  variant="standard"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                  }}
                />
                <Button
                  fullWidth={true}
                  variant="outlined"
                  type="submit"
                  disabled={confirmText !== 'DELETE'}
                >
                  Delete Bracket (Cannot be undone)
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Modal>
  );
}
