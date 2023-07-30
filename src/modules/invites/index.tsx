import { useState, useEffect, useRef, Fragment } from 'react';

import { useSession, signIn, signOut, getSession } from 'next-auth/react';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import { useSnackbarContext } from '../../common/contexts/mui';

// MUI
import {
  Alert,
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
import { BracketListing } from '../../common/types/bracket';
import { InvitesData } from '../../pages/api/user/invites';

export default function Invites() {
  const theme = useTheme();
  const { data: session, status, update } = useSession();
  const snackbar = useSnackbarContext();

  const [invites, setInvites] = useState<BracketListing[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/user/invites`);
      const invitesData: InvitesData = await res.json();
      if (!('message' in invitesData)) {
        setInvites(invitesData);
      }
    })();
  }, []);

  if (invites.length === 0) {
    return <Typography variant="h2">Invites empty</Typography>;
  }

  return (
    <Stack direction="row" spacing={3}>
      {invites?.map((invite) => (
        <Paper key={invite.id}>
          <Typography variant="h4">{invite.name}</Typography>
          {invite.role && <Typography variant="h6">{invite.role}</Typography>}
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth={true}
              variant="contained"
              onClick={async (e) => {
                e.preventDefault();
                let res = await fetch(`/api/user/invite/accept/${invite.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-type': 'application/json',
                  },
                });
                if (res.status === 200) {
                  setInvites((prev) => {
                    return prev.filter(
                      (prevInvite) => prevInvite.id !== invite.id
                    );
                  });
                  snackbar.pushSnack({
                    children: (
                      <Alert
                        variant="filled"
                        onClose={snackbar.handleClose}
                        severity="success"
                        // sx={{ width: '100%' }}
                      >
                        Invite accepted.
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
                        Could not accept invite.
                      </Alert>
                    ),
                  });
                }
              }}
            >
              Accept
            </Button>
            <Button
              fullWidth={true}
              variant="outlined"
              onClick={async (e) => {
                e.preventDefault();
                let res = await fetch(`/api/user/invite/reject/${invite.id}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-type': 'application/json',
                  },
                });
                if (res.status === 200) {
                  setInvites((prev) => {
                    return prev.filter(
                      (prevInvite) => prevInvite.id !== invite.id
                    );
                  });
                  snackbar.pushSnack({
                    children: (
                      <Alert
                        variant="filled"
                        onClose={snackbar.handleClose}
                        severity="success"
                        // sx={{ width: '100%' }}
                      >
                        Invite rejected.
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
                        Could not reject invite.
                      </Alert>
                    ),
                  });
                }
              }}
            >
              Reject
            </Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
