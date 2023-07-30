import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import MainLayout from '../../../../common/layouts/app';
import BracketEditor from '../../../../modules/editor';
import { useSession, signIn, signOut } from 'next-auth/react';
// MUI
import {
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  Unstable_Grid2 as Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
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
// Types
import type { NextPageWithLayout } from '../../../_app';
import type { GetEditBracketData } from '../../../api/bracket/getBracket/[id]/edit';

const Page: NextPageWithLayout = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [bracketData, setBracketData] = useState<GetEditBracketData>();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(
        router.asPath.slice(0, router.asPath.lastIndexOf('/edit'))
      );
    }
    if (status !== 'authenticated' || !router.isReady) return;
    try {
      (async () => {
        let res = await fetch(
          `/api/bracket/getBracket/${router.query.id}/edit`
        );
        if (res.status !== 200) {
          return router.replace(
            router.asPath.slice(0, router.asPath.lastIndexOf('/edit'))
          );
        }
        let bracketJson: GetEditBracketData = await res.json();
        if (!bracketJson) {
          router.replace(
            router.asPath.slice(0, router.asPath.lastIndexOf('/edit'))
          );
        }
        if ('message' in bracketJson) return;
        setBracketData(() => bracketJson);
      })();
    } catch (err) {
      console.error(err);
    }
  }, [router, status]);

  if (bracketData === undefined || 'message' in bracketData) {
    return <Typography>Loading</Typography>;
  }

  return (
    <>
      <Head>
        {/* Basic metadata */}
        <title>Edit {`${bracketData.settings.name} | MakeABracket.com`}</title>
        <meta
          name="description"
          content={`Edit the bracket settings for ${bracketData.settings.name}.`}
        />
        <meta name="author" content="MakeABracket.com" />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta
          property="og:title"
          content={`Edit ${bracketData.settings.name} | MakeABracket.com`}
        />
        <meta
          property="og:description"
          content={`Edit the bracket settings for ${bracketData.settings.name}.`}
        />
        <meta property="og:image" content={bracketData.settings.image} />
        <meta
          property="og:url"
          content={
            process.env.NEXT_PUBLIC_SITE_URL +
            `/b/${bracketData.settings.slug}/${bracketData.settings.id}/edit`
          }
        />
        <meta property="og:type" content="website" />
        {/* Twitter Card */}
        <meta
          name="twitter:title"
          content={`Edit ${bracketData.settings.name} | MakeABracket.com`}
        />
        <meta
          name="twitter:description"
          content={`Edit the bracket settings for ${bracketData.settings.name}.`}
        />
        <meta name="twitter:image" content={bracketData.settings.image} />
        <meta
          name="twitter:card"
          content={bracketData.settings.name + 'bracket image'}
        />
      </Head>

      <main style={{ height: '100%' }}>
        {bracketData !== undefined && !('message' in bracketData) ? (
          <BracketEditor bracketData={bracketData} />
        ) : (
          <>
            <Typography>Loading</Typography>
          </>
        )}
      </main>

      <footer></footer>
    </>
  );
};

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;
