import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import MainLayout from '../../../../common/layouts/app';
import { authOptions } from '../../../api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { getDB, sql } from '../../../../common/utils/pgp';
import { useSession, signIn, signOut } from 'next-auth/react';
import Bracket from '../../../../modules/bracket';
import Leaderboard from '../../../../modules/leaderboard';

// MUI Contexts
import { useSnackbarContext } from '../../../../common/contexts/mui';

// MUI
import { Alert, Button, Fab, Unstable_Grid2 as Grid } from '@mui/material';

// Material Icons
import EditIcon from '@mui/icons-material/Edit';

// Types
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import type { NextPageWithLayout } from '../../../_app';
import type {
  Bracket as BracketProps,
  UserPick,
  NewUserPick,
} from '../../../../common/types/bracket';

const Page: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ bracket }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const snackbar = useSnackbarContext();

  const [picks, setPicks] = useState<(NewUserPick | UserPick)[][] | undefined>(
    () => {
      if (bracket?.settings?.bracket_type.includes('voting')) return;
      return (
        bracket.picks ||
        bracket.rounds.map((round) => {
          return round.games.map((game) => {
            return {
              bracket_id: bracket.settings.id,
              game_key: game.key,
              player_1: game.player_1,
              player_2: game.player_2,
              winner: '',
              player_1_score: null,
              player_2_score: null,
            };
          });
        })
      );
    }
  );

  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  function LeaderboardGrid() {
    if (
      !router?.isReady ||
      bracket?.settings?.bracket_type?.includes('voting') ||
      Array.isArray(router.query.id) ||
      !Number.isInteger(Number(router.query.id))
    ) {
      return <></>;
    } else {
      const id = Number(router.query.id);
      return (
        <Grid
          md={6}
          sx={{ display: showLeaderboard ? 'block' : 'none', height: '100%' }}
        >
          <Leaderboard bracket_id={id} />
        </Grid>
      );
    }
  }

  const [votes, setVotes] = useState(bracket.votes);

  return (
    <>
      <Head>
        {/* Basic metadata */}
        <title>{`${bracket.settings.name} | MakeABracket.com`}</title>
        <meta
          name="description"
          content={
            bracket.settings.description ||
            bracket.settings.bracket_type.includes('voting')
              ? `Vote in the ${bracket.settings.name} bracket.`
              : `Set your picks for the ${bracket.settings.name} bracket.`
          }
        />
        <meta name="author" content="MakeABracket.com" />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta
          property="og:title"
          content={`${bracket.settings.name} | MakeABracket.com`}
        />
        <meta
          property="og:description"
          content={
            bracket.settings.description ||
            bracket.settings.bracket_type.includes('voting')
              ? `Vote in the ${bracket.settings.name} bracket.`
              : `Set your picks for the ${bracket.settings.name} bracket.`
          }
        />
        <meta property="og:image" content={bracket.settings.image} />
        <meta
          property="og:url"
          content={
            process.env.NEXT_PUBLIC_SITE_URL +
            `/b/${bracket.settings.slug}/${bracket.settings.id}`
          }
        />
        <meta property="og:type" content="website" />
        {/* Twitter Card */}
        <meta
          name="twitter:title"
          content={`${bracket.settings.name} | MakeABracket.com`}
        />
        <meta
          name="twitter:description"
          content={
            bracket.settings.description ||
            bracket.settings.bracket_type.includes('voting')
              ? `Vote in the ${bracket.settings.name} bracket.`
              : `Set your picks for the ${bracket.settings.name} bracket.`
          }
        />
        <meta name="twitter:image" content={bracket.settings.image} />
        <meta
          name="twitter:card"
          content={bracket.settings.name + 'bracket image'}
        />
      </Head>

      <main style={{ height: '100%' }}>
        <Grid container sx={{ height: '100%' }}>
          <LeaderboardGrid />
          <Grid md={showLeaderboard ? 6 : 12} sx={{ height: '100%' }}>
            {!bracket?.settings?.bracket_type?.includes('voting') && (
              <Button
                variant="contained"
                onClick={async () => {
                  let res = await fetch('/api/bracket/setPicks', {
                    method: 'PUT',
                    headers: {
                      'Content-type': 'application/json',
                    },
                    body: JSON.stringify({
                      picks,
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
                          Set picks.
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
                          Could not set picks.
                        </Alert>
                      ),
                    });
                  }
                }}
              >
                submit your picks
              </Button>
            )}
            {!bracket?.settings?.bracket_type?.includes('voting') && (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowLeaderboard(!showLeaderboard)}
              >
                Leaderboard
              </Button>
            )}
            <Bracket
              rounds={bracket.rounds}
              participants={bracket.participants}
              settings={bracket.settings}
              votes={votes}
              setVotes={setVotes}
              picks={picks}
              setPicks={setPicks}
            />
          </Grid>
        </Grid>
      </main>

      <footer></footer>
      {(bracket.member?.role === 'owner' ||
        bracket.member?.role === 'admin') && (
        <Fab
          LinkComponent={Link}
          href={`${router.asPath}/edit`}
          sx={{
            position: 'fixed',
            bottom: (theme) => theme.spacing(2),
            right: (theme) => theme.spacing(2),
          }}
          variant="extended"
          color="primary"
          aria-label="edit"
        >
          <EditIcon sx={{ mr: 1 }} /> Edit
        </Fab>
      )}
    </>
  );
};

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps<{
  bracket: BracketProps;
}> = async (context) => {
  try {
    const { db, pgp } = getDB();
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions
    );

    if (!session) {
      // return {
      //   redirect: {
      //     destination: '/',
      //     permanent: false,
      //   },
      // };
    }

    const bracketId = Number(context?.params?.id);
    if (typeof bracketId !== 'number') {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    let bracketData = await sql.bracket.getBracket(
      db,
      bracketId,
      session?.user?.id
    );

    if ('error' in bracketData) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    let bracket = JSON.parse(JSON.stringify(bracketData));

    // if (needToUpdateBracket) {
    //   bracket = JSON.parse(
    //     JSON.stringify(await sql.bracket.getBracket(db, context.params.id))
    //   );
    // }

    return {
      props: {
        session,
        bracket,
      },
    };
  } catch (err) {
    console.error(err);
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
};

export default Page;
