import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '../common/layouts/app';
// Banner Images
import OutsideDunk from '../../public/banners/2023/outside-dunk.jpg';
import Esports from '../../public/banners/2023/esports.jpg';
import FootballReferee from '../../public/banners/2023/football-referee.jpg';
import ConcertStage from '../../public/banners/2023/concert-stage.jpg';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useSnackbarContext } from '../common/contexts/mui';
import { useTheme } from '@mui/material/styles';

// MUI
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Unstable_Grid2 as Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

// MUI Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type { NextPageWithLayout } from './_app';

function Component() {
  const { data: session, status } = useSession();
  const theme = useTheme();
  const snackbar = useSnackbarContext();

  function TransPaper(props: React.PropsWithChildren) {
    return (
      <Paper
        sx={{
          p: 3,
          backgroundColor:
            theme.palette.mode === 'dark'
              ? 'rgba(0, 0, 0, .6)'
              : 'rgba(255, 255, 255, .6)',
        }}
      >
        {props.children}
      </Paper>
    );
  }

  return (
    <>
      <Container maxWidth="md" sx={{ p: 5 }}>
        {/* <Stack justifyContent="center"> */}
        <Typography
          variant="h1"
          fontSize="5rem"
          sx={{ textTransform: 'uppercase' }}
        >
          If you can dream it you can bracket.
        </Typography>
        <Typography>
          Bracket anything! Sports, movies, places, names, vacations, careers,
          outings, cars, or imaginary such as who would win a race between
          vintage cartoon characters. If you dream it, you can Bracket!
        </Typography>
        {status === 'unauthenticated' && (
          <Button
            variant="contained"
            onClick={() => signIn()}
            sx={{ display: 'block', mt: 2, mx: 'auto' }}
          >
            Login or Sign Up
          </Button>
        )}
        {/* </Stack> */}
      </Container>

      <Box
        sx={{
          position: 'relative',
          aspectRatio: { xs: '1 / 1', sm: '16 / 10' },
        }}
      >
        <Grid container sx={{ height: '100%' }}>
          <Grid xs={12} sm={7} md={5} sx={{ p: 3 }}>
            <Stack justifyContent="center" sx={{ height: '100%' }}>
              <TransPaper>
                <Stack spacing={2}>
                  <Typography variant="h3">
                    Explore Brackets & Make Your Picks
                  </Typography>
                  <Button
                    LinkComponent={Link}
                    href="/brackets"
                    variant="contained"
                  >
                    Brackets
                  </Button>
                </Stack>
              </TransPaper>
            </Stack>
          </Grid>
        </Grid>
        <Image
          src={OutsideDunk}
          alt="Basketball player dunking outside"
          fill
          // unoptimized={true}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: -1,
          }}
        />
      </Box>

      <Box
        sx={{
          position: 'relative',
          aspectRatio: { xs: '1 / 1', sm: '16 / 10' },
        }}
      >
        <Grid container sx={{ height: '100%' }}>
          <Grid xs={12} sm={7} smOffset={5} md={5} mdOffset={7} sx={{ p: 3 }}>
            <Stack justifyContent="center" sx={{ height: '100%' }}>
              <TransPaper>
                <Stack spacing={2}>
                  <Typography variant="h3">
                    Make a bracket about anything.
                  </Typography>
                  <Button LinkComponent={Link} href="/new" variant="contained">
                    Make a Bracket
                  </Button>
                </Stack>
              </TransPaper>
            </Stack>
          </Grid>
        </Grid>
        <Image
          src={Esports}
          alt="Esports competition"
          fill
          unoptimized={true}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: -1,
          }}
        />
      </Box>

      <Box
        sx={{
          position: 'relative',
          aspectRatio: { xs: '1 / 1', sm: '16 / 10' },
        }}
      >
        <Grid container sx={{ height: '100%' }}>
          <Grid xs={12} sm={7} md={5} sx={{ p: 3 }}>
            <Stack justifyContent="center" sx={{ height: '100%' }}>
              <TransPaper>
                <Stack spacing={2}>
                  <Typography variant="h3">Make it cool and unique.</Typography>
                  <Button LinkComponent={Link} href="/new" variant="contained">
                    Make a bracket.
                  </Button>
                </Stack>
              </TransPaper>
            </Stack>
          </Grid>
        </Grid>
        <Image
          src={ConcertStage}
          alt="Concert stage"
          fill
          unoptimized={true}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: -1,
          }}
        />
      </Box>

      <Box
        sx={{
          position: 'relative',
          aspectRatio: { xs: '1 / 1', sm: '16 / 10' },
        }}
      >
        <Grid container sx={{ height: '100%' }}>
          <Grid xs={12} sm={7} smOffset={5} md={5} mdOffset={7} sx={{ p: 3 }}>
            <Stack justifyContent="center" sx={{ height: '100%' }}>
              <TransPaper>
                <Stack spacing={2}>
                  <Typography variant="h3">You decide the rules.</Typography>
                  <Button LinkComponent={Link} href="/new" variant="contained">
                    Make a Bracket
                  </Button>
                </Stack>
              </TransPaper>
            </Stack>
          </Grid>
        </Grid>
        <Image
          src={FootballReferee}
          alt="Football referee"
          fill
          unoptimized={true}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: -1,
          }}
        />
      </Box>

      <Container maxWidth="sm" sx={{ p: 5 }}>
        <Typography
          variant="h1"
          fontSize="5rem"
          sx={{ textTransform: 'uppercase' }}
        >
          Get Started
        </Typography>
        <Typography>
          It&apos;s free to sign up and make picks, and free for non-commercial
          use to make a bracket about anything you want. We also have business,
          partnership, and premium options coming soon.
        </Typography>
        {/* <Card> */}
        <Stack
          direction="row"
          spacing={3}
          useFlexGap
          flexWrap="wrap"
          rowGap={0}
        >
          <Typography
            display="flex"
            alignItems="center"
            columnGap={0.5}
            sx={{ fontSize: 24 }}
          >
            <CheckCircleIcon /> Free sign up
          </Typography>
          <Typography
            display="flex"
            alignItems="center"
            columnGap={1}
            sx={{ fontSize: 24 }}
          >
            <CheckCircleIcon /> Free picks
          </Typography>
          <Typography
            display="flex"
            alignItems="center"
            columnGap={1}
            sx={{ fontSize: 24 }}
          >
            <CheckCircleIcon /> Free for non-commercial use
          </Typography>
        </Stack>
        {/* </Card> */}
      </Container>
    </>
  );
}

const Page: NextPageWithLayout = () => {
  return (
    <div>
      <Head>
        {/* Basic metadata */}
        <title>MakeABracket.com</title>
        <meta
          name="description"
          content="Create and customize brackets of variable sizes on MakeABracket.com. Design your own March Madness-style tournaments or engage in head-to-head matchups where users vote to determine a winner. Join the excitement, unleash your competitive spirit, and discover who will emerge victorious in these thrilling bracket challenges."
        />
        <meta name="author" content="MakeABracket.com" />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta property="og:title" content="MakeABracket.com" />
        <meta
          property="og:description"
          content="Create and customize brackets of variable sizes on MakeABracket.com. Design your own March Madness-style tournaments or engage in head-to-head matchups where users vote to determine a winner. Join the excitement, unleash your competitive spirit, and discover who will emerge victorious in these thrilling bracket challenges."
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
        <meta name="twitter:title" content="MakeABracket.com" />
        <meta
          name="twitter:description"
          content="Create and customize brackets of variable sizes on MakeABracket.com. Design your own March Madness-style tournaments or engage in head-to-head matchups where users vote to determine a winner. Join the excitement, unleash your competitive spirit, and discover who will emerge victorious in these thrilling bracket challenges."
        />
        <meta
          name="twitter:image"
          content={
            process.env.NEXT_PUBLIC_SITE_URL + '/Make_A_Bracket_Icon_BonT.png'
          }
        />
        <meta name="twitter:card" content="MakeABracket.com" />
      </Head>

      <main>
        <Component />
      </main>

      <footer></footer>
    </div>
  );
};

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;
