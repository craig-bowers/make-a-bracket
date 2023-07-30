import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import EmbedLayout from '../../../../common/layouts/embed';

import { authOptions } from '../../../api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { getDB, sql } from '../../../../common/utils/pgp';

import { useSession, signIn, signOut } from 'next-auth/react';

import Bracket from '../../../../modules/bracket';

import GlobalStyles from '@mui/material/GlobalStyles'; // Global overrides

// MUI
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  Fab,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material';

// Material Icons

// Types
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import type { NextPageWithLayout } from '../../../_app';
import type { Bracket as BracketProps } from '../../../../common/types/bracket';

const Page: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ bracket }) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [votes, setVotes] = useState(bracket.votes);

  const inputGlobalStyles = (
    <GlobalStyles
      styles={{
        html: { height: 'auto' },
        body: { height: 'auto' },
      }}
    />
  );

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
      {inputGlobalStyles}
      <Script
        // strategy="lazyOnload"
        src={
          'https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.6/iframeResizer.contentWindow.min.js'
        }
        // onLoad={() => {
        //   console.log('Script has loaded');
        // }}
      ></Script>
      <main style={{ height: '100%' }}>
        <Bracket
          rounds={bracket.rounds}
          participants={bracket.participants}
          settings={bracket.settings}
          votes={votes}
          setVotes={setVotes}
        />
      </main>

      <footer></footer>
      <Fab
        LinkComponent="a"
        href={`${process.env.NEXT_PUBLIC_SITE_URL}/b/${bracket.settings.slug}/${bracket.settings.id}`}
        target="_blank"
        sx={{
          position: 'fixed',
          bottom: (theme) => theme.spacing(2),
          right: (theme) => theme.spacing(2),
        }}
        variant="extended"
        color="primary"
        aria-label="open in browser"
      >
        {/* <EditIcon sx={{ mr: 1 }} />  */}MakeABracket.com
      </Fab>
    </>
  );
};

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <EmbedLayout>{page}</EmbedLayout>;
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

    // if (!session) {
    //   return {
    //     redirect: {
    //       destination: '/',
    //       permanent: false,
    //     },
    //   };
    // }

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
