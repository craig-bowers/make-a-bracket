import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import MainLayout from '../../common/layouts/app';

import { useSession, signIn, signOut, getSession } from 'next-auth/react';

// Custom Components
import UserBrackets from '../../modules/brackets/user';
import Invites from '../../modules/invites';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import { useSnackbarContext } from '../../common/contexts/mui';

// MUI
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Unstable_Grid2 as Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
  TextField,
  useMediaQuery,
} from '@mui/material';

// Mui Colors
import { grey } from '@mui/material/colors';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import CasinoIcon from '@mui/icons-material/Casino';
import RsvpIcon from '@mui/icons-material/Rsvp';

// Types
import type { NextPageWithLayout } from '../_app';

const profileTabs = [
  {
    key: 'profile',
    text: 'Profile',
    icon: <PersonIcon />,
  },
  {
    key: 'userBrackets',
    text: 'User Brackets',
    icon: <CasinoIcon />,
  },
  {
    key: 'invites',
    text: 'Invites',
    icon: <RsvpIcon />,
  },
];

function Component() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const snackbar = useSnackbarContext();

  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));
  let xs = useMediaQuery(theme.breakpoints.only('xs'));
  let smMd = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  let lgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const [editing, setEditing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<string>('profile');

  // Form
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [display_name, setDisplay_Name] = useState('');

  useEffect(() => {
    if (status === 'loading' || !router.isReady) return;
    else if (status === 'unauthenticated') router.replace('/');

    setName(session?.user?.name || '');
    setDisplay_Name(session?.user?.display_name || '');
    setImage(session?.user?.image || '');
  }, [router, session, status]);

  return status === 'authenticated' ? (
    <Container sx={{ pt: 3, height: '100%' }}>
      <Grid container spacing={3} sx={{ height: '100%', overflow: 'auto' }}>
        <Grid
          xs={12}
          sm={6}
          sx={smUp ? { height: '100%', overflow: 'auto' } : {}}
        >
          <Stack sx={{ justifyContent: 'center', alignItems: 'center' }}>
            <Box
              sx={{
                position: 'relative',
                aspectRatio: '1 / 1',
                backgroundColor: grey[400],
                width: '50%',
              }}
            >
              {session?.user?.image && (
                <Image
                  src={`${session?.user?.image || ''}`}
                  alt={`${session?.user?.name + ' ' || ''}profile picture`}
                  fill
                  unoptimized={true}
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              )}
            </Box>
            <Typography>{session?.user?.name}</Typography>
            <Typography>{session?.user?.display_name}</Typography>
            <List sx={{ height: '100%', overflow: 'auto' }}>
              {profileTabs.map((item) => {
                return (
                  <ListItem key={item.key} disablePadding>
                    <ListItemButton
                      selected={selectedIndex === item.key}
                      onClick={(e) => {
                        if (selectedIndex === item.key) {
                          return;
                        } else setSelectedIndex(item.key);
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Stack>
          {smDown && <Divider />}
        </Grid>
        <Grid
          xs={12}
          sm={6}
          sx={smUp ? { height: '100%', overflow: 'auto' } : {}}
        >
          <Paper sx={{ p: 3 }}>
            {selectedIndex === 'profile' && (
              <Stack
                spacing={2}
                component="form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  let res = await fetch('/api/user/edit/profile', {
                    method: 'PUT',
                    headers: { 'Content-type': 'application/json' },
                    body: JSON.stringify({
                      name,
                      image,
                      display_name,
                    }),
                  });
                  if (res.status === 200) {
                    setEditing(false);
                    update({
                      name,
                      image,
                      display_name,
                    });
                    snackbar.pushSnack({
                      children: (
                        <Alert
                          variant="filled"
                          onClose={snackbar.handleClose}
                          severity="success"
                          sx={{ width: '100%' }}
                        >
                          Profile updated.
                        </Alert>
                      ),
                    });
                  } else if (res.status !== 200) {
                    let { message } = await res.json();
                    snackbar.pushSnack({
                      children: (
                        <Alert
                          variant="filled"
                          onClose={snackbar.handleClose}
                          severity="error"
                          sx={{ width: '100%' }}
                        >
                          {message}
                        </Alert>
                      ),
                    });
                  }
                }}
              >
                {/* Name */}
                <TextField
                  disabled={!editing}
                  type="text"
                  fullWidth={true}
                  label="Name"
                  value={name}
                  onChange={(e) => {
                    setName(() => e.target.value);
                  }}
                />

                {/* Display Name */}
                <TextField
                  disabled={!editing}
                  type="text"
                  fullWidth={true}
                  label="Display Name"
                  value={display_name}
                  onChange={(e) => {
                    setDisplay_Name(() => e.target.value);
                  }}
                />

                {/* Image URL */}
                <TextField
                  disabled={!editing}
                  type="text"
                  fullWidth={true}
                  label="Image URL"
                  value={image}
                  onChange={(e) => {
                    setImage(() => e.target.value);
                  }}
                />

                {!editing ? (
                  <Button variant="contained" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <Grid container spacing={2} sx={{ p: 0 }}>
                    <Grid xs={6} sx={{ py: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => {
                          setName(session?.user?.name || '');
                          setDisplay_Name(session?.user?.display_name || '');
                          setImage(session?.user?.image || '');
                          setEditing(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </Grid>
                    <Grid xs={6} sx={{ py: 0 }}>
                      <Button fullWidth variant="contained" type="submit">
                        Save
                      </Button>
                    </Grid>
                  </Grid>
                )}
              </Stack>
            )}
            {selectedIndex === 'userBrackets' && <UserBrackets />}
            {selectedIndex === 'invites' && <Invites />}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  ) : (
    <></>
  );
}

const Page: NextPageWithLayout = () => {
  const { data: session, status, update } = useSession();

  return (
    <>
      <Head>
        {/* Basic metadata */}
        <title>
          {session?.user?.display_name || session?.user?.name
            ? session?.user?.display_name + ' | MakeABracket.com' ??
              session?.user?.name + ' | MakeABracket.com'
            : 'MakeABracket.com'}
        </title>
        <meta
          name="description"
          content="View or edit your MakeABracket.com profile."
        />
        <meta name="author" content="MakeABracket.com" />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta
          property="og:title"
          content={
            session?.user?.display_name || session?.user?.name
              ? session?.user?.display_name + ' | MakeABracket.com' ??
                session?.user?.name + ' | MakeABracket.com'
              : 'MakeABracket.com'
          }
        />
        <meta
          property="og:description"
          content="View or edit your MakeABracket.com profile."
        />
        <meta
          property="og:image"
          content={
            process.env.NEXT_PUBLIC_SITE_URL + '/Make_A_Bracket_Icon_BonT.png'
          }
        />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_SITE_URL} />
        <meta property="og:type" content="website" />
        {/* Twitter Card */}
        <meta
          name="twitter:title"
          content={
            session?.user?.display_name || session?.user?.name
              ? session?.user?.display_name + ' | MakeABracket.com' ??
                session?.user?.name + ' | MakeABracket.com'
              : 'MakeABracket.com'
          }
        />
        <meta
          name="twitter:description"
          content="View or edit your MakeABracket.com profile."
        />
        <meta
          name="twitter:image"
          content={
            process.env.NEXT_PUBLIC_SITE_URL + '/Make_A_Bracket_Icon_BonT.png'
          }
        />
        <meta name="twitter:card" content="User profile on MakeABracket.com." />
      </Head>

      <main style={{ height: '100%' }}>
        <Component />
      </main>

      <footer></footer>
    </>
  );
};

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;
