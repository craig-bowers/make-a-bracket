import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import MainLayout from '../../../common/layouts/app';

import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import { validate as uuidValidate } from 'uuid';

// Custom Components
import UserBrackets from '../../../modules/brackets/user';
import Invites from '../../../modules/invites';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import { useSnackbarContext } from '../../../common/contexts/mui';

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
import { Settings } from '../../../common/types/bracket';
import type { NextPageWithLayout } from '../../_app';

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

  const [header, setHeader] = useState('Loading');

  useEffect(() => {
    if (status === 'loading') {
      return setHeader(() => 'Loading');
    } else if (status === 'unauthenticated') {
      return setHeader(() => 'Please sign in');
    } else if (status === 'authenticated') {
      setHeader(() => 'Accepting your invite.'); // do not return
    } else if (!router.isReady) {
      return;
    }

    if (
      typeof router.query.hash !== 'string' ||
      !uuidValidate(router.query.hash)
    ) {
      router.replace('/');
      return;
    }

    (async () => {
      let res = await fetch(`/api/user/invite/email/${router.query.hash}`);
      if (res.status === 200) {
        snackbar.pushSnack({
          children: (
            <Alert
              variant="filled"
              onClose={snackbar.handleClose}
              severity="success"
              // sx={{ width: '100%' }}
            >
              Accepted invite. Redirecting...
            </Alert>
          ),
        });
        const bracket: Settings = await res.json();
        return router.replace(`/b/${bracket.slug}/${bracket.id}`);
      } else {
        snackbar.pushSnack({
          children: (
            <Alert
              variant="filled"
              onClose={snackbar.handleClose}
              severity="error"
              // sx={{ width: '100%' }}
            >
              Could not accept bracket.
            </Alert>
          ),
        });
      }
      return router.replace('/');
    })();
  }, [router, snackbar, status]);

  return (
    <Stack justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
      <Typography textAlign="center" variant="h1">
        {header}
      </Typography>
      {status === 'unauthenticated' && (
        <Button variant="contained" onClick={() => signIn()}>
          Sign In / Sign Up
        </Button>
      )}
    </Stack>
  );
}

const Page: NextPageWithLayout = () => {
  const { data: session, status, update } = useSession();

  return (
    <>
      <Head>
        {/* Basic metadata */}
        <title>Bracket Invite | MakeABracket.com</title>
        <meta name="description" content="Accept your bracket invite." />
        <meta name="author" content="MakeABracket.com" />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta property="og:title" content="Bracket Invite | MakeABracket.com" />
        <meta property="og:description" content="Accept your bracket invite." />
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
          content="Bracket Invite | MakeABracket.com"
        />
        <meta
          name="twitter:description"
          content="Accept your bracket invite."
        />
        <meta
          name="twitter:image"
          content={
            process.env.NEXT_PUBLIC_SITE_URL + '/Make_A_Bracket_Icon_BonT.png'
          }
        />
        <meta name="twitter:card" content="This is your private invite link." />
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
