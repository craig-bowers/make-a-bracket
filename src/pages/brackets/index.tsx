import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import MainLayout from '../../common/layouts/app';

import { useSession, signIn, signOut } from 'next-auth/react';

// Custom Components
import StackLayout from '../../modules/brackets/layout/stack';
import MasonryLayout from '../../modules/brackets/layout/masonry';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// MUI
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from '@mui/material';

// Mui Colors
import { grey } from '@mui/material/colors';

// Icons
import TableRowsSharpIcon from '@mui/icons-material/TableRowsSharp';
import AutoAwesomeMosaicSharpIcon from '@mui/icons-material/AutoAwesomeMosaicSharp';
import ClearIcon from '@mui/icons-material/Clear';

// Types
import type { NextPageWithLayout } from '../_app';
import type { BracketListing, Category } from '../../common/types/bracket';

function Component() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const theme = useTheme();
  let xs = useMediaQuery(theme.breakpoints.only('xs'));
  let smMd = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  let lgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const [categories, setCategories] = useState<Category[] | undefined>();
  const [brackets, setBrackets] = useState<BracketListing[]>([]);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [loadMoreNow, setLoadMoreNow] = useState(false);
  const [loadMoreLimit, setLoadMoreLimit] = useState(20); // default 20 even if not sent in query; max 100
  const [masonryLayout, setMasonryLayout] = useState(true);

  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const [timestamp, setTimestamp] = useState<number>(() => Date.now());

  const allCatsRunOnlyOnce = useRef<boolean>(false);

  useEffect(() => {
    if (!router.isReady || status === 'loading') return;
    if (allCatsRunOnlyOnce.current === true) return;

    (async () => {
      let res = await fetch('/api/categories/all');
      let cats: Category[] = await res.json();
      setAllCategories(() => cats);
      // If you provide a rich object, the reference has to match. https://github.com/mui/material-ui/issues/16775
      // setCategories(() => cats);
      let categoryIds: number[] = [];
      if (Array.isArray(router.query.catId)) {
        // e.g. ?catId=1&catId=2 will be an array
        for (let id of router.query.catId) {
          categoryIds.push(Number(id));
        }
      } else if (typeof router.query.catId === 'string') {
        // e.g. ?catId=1 will be a string
        categoryIds.push(Number(router.query.catId));
      }
      setCategories(() => {
        if (categoryIds.length > 0) {
          return cats.filter(
            (cat) =>
              categoryIds.findIndex((categoryId) => categoryId === cat.id) > -1
          );
        } else return [];
      });
    })();

    allCatsRunOnlyOnce.current = true;
    setLoadMoreNow(() => true);
  }, [loadMoreNow, router, status]);

  useEffect(() => {
    if (!loadMoreNow || !canLoadMore || !Array.isArray(categories)) return;
    try {
      // Path URL + modifications below for browser
      const currentUrl = new URL(
        window.location.origin + window.location.pathname
      );
      // API URL + modifications below for fetching
      let apiUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/api/brackets`);
      // Loop through selected categories
      for (let cat of categories) {
        currentUrl.searchParams.append('catId', cat.id.toString());
        apiUrl.searchParams.append('catId', cat.id.toString());
      }
      // Add limit to url
      apiUrl.searchParams.append('limit', loadMoreLimit.toString());
      // Add offset to url
      apiUrl.searchParams.append('offset', brackets.length.toString());
      // Add timestamp to url
      apiUrl.searchParams.append('timestamp', timestamp.toString());

      router.push(currentUrl, undefined, {
        shallow: true,
      });

      (async () => {
        let res = await fetch(apiUrl);
        let { brackets: moreBrackets, canLoadMore: updatedCanLoadMore } =
          await res.json();
        setLoadMoreNow(false);
        setBrackets([...brackets, ...(moreBrackets ? moreBrackets : [])]);
        setCanLoadMore(updatedCanLoadMore);
      })();
    } catch (err) {
      console.error(err);
    }
  }, [brackets, loadMoreNow, categories]);

  return status === 'loading' ? (
    <></>
  ) : (
    <Box
      component="main"
      sx={{
        height: '100%',
        overflowY: 'auto',
        p: theme.spacing(1),
        pt: theme.spacing(2),
      }}
      onScroll={(e) => {
        if (
          e.currentTarget.scrollTop + e.currentTarget.clientHeight ===
          e.currentTarget.scrollHeight
        ) {
          setLoadMoreNow(() => true);
        }
      }}
    >
      <Grid container spacing={2} sx={{ mb: theme.spacing(2) }}>
        {/* <Grid
          item
          xs={12}
          sm={5}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Button>Placeholder</Button>
        </Grid> */}
        <Grid
          item
          xs={9}
          sm={8}
          md={6}
          xl={5}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {/* Categories */}
          <FormControl fullWidth>
            <InputLabel id="categories-checkbox-label">Categories</InputLabel>
            <Stack direction="row" spacing={1}>
              <Select
                labelId="categories-checkbox-label"
                id="categories-checkbox"
                fullWidth
                multiple
                value={categories || []}
                onChange={(event) => {
                  const {
                    target: { value },
                  } = event;
                  typeof value !== 'string' && setCategories(() => value);
                }}
                input={<OutlinedInput label="Categories" />}
                renderValue={(selected) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'nowrap',
                      overflowX: 'hidden',
                      gap: 0.5,
                    }}
                  >
                    {selected.map((value) => (
                      <Chip key={value.id} label={value.name} />
                    ))}
                  </Box>
                )}
                // MenuProps={{
                //   PaperProps: {
                //     style: {
                //       maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                //       width: 250,
                //     },
                //   },
                // }}
              >
                {allCategories.map((category) => (
                  // @ts-ignore
                  <MenuItem
                    key={category.id}
                    value={category}
                    onClick={() => {
                      setCanLoadMore(() => true);
                      setTimestamp(() => Date.now());
                      setBrackets(() => []);
                      setLoadMoreNow(() => true);
                    }}
                  >
                    <Checkbox
                      checked={
                        categories
                          ? categories.findIndex(
                              (cat) => cat.id === category.id
                            ) > -1
                          : false
                      }
                    />
                    <ListItemText primary={category.name} />
                  </MenuItem>
                ))}
              </Select>{' '}
              <IconButton
                sx={{ alignSelf: 'center' }}
                onClick={() => {
                  setCategories(() => []);
                  setCanLoadMore(() => true);
                  setLoadMoreNow(() => true);
                }}
              >
                <ClearIcon />
              </IconButton>{' '}
            </Stack>
          </FormControl>
        </Grid>
        <Grid
          item
          xs={3}
          sm={4}
          md={6}
          xl={7}
          display="flex"
          alignItems="center"
          justifyContent="end"
        >
          <Stack direction="row" justifyContent="center" alignItems="center">
            <IconButton
              sx={{ alignSelf: 'center' }}
              onClick={() => setMasonryLayout(false)}
            >
              <TableRowsSharpIcon />
            </IconButton>
            <IconButton
              sx={{ alignSelf: 'center' }}
              onClick={() => setMasonryLayout(true)}
            >
              <AutoAwesomeMosaicSharpIcon />
            </IconButton>
          </Stack>
        </Grid>
      </Grid>
      {!masonryLayout && <StackLayout brackets={brackets} />}
      {masonryLayout && <MasonryLayout brackets={brackets} />}

      {canLoadMore && (
        <Divider sx={{ mt: theme.spacing(3) }}>
          <Chip label="LOADING" />
        </Divider>
      )}
    </Box>
  );
}

const Page: NextPageWithLayout = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        {/* Basic metadata */}
        <title>Brackets | MakeABracket.com</title>
        <meta
          name="description"
          content="Peruse the brackets on MakeABracket.com."
        />
        <meta name="author" content="MakeABracket.com" />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta property="og:title" content="Brackets | MakeABracket.com" />
        <meta
          property="og:description"
          content="Peruse the brackets on MakeABracket.com."
        />
        <meta
          property="og:image"
          content={
            process.env.NEXT_PUBLIC_SITE_URL + '/Make_A_Bracket_Icon_BonT.png'
          }
        />
        <meta
          property="og:url"
          content={process.env.NEXT_PUBLIC_SITE_URL + router.asPath}
        />
        <meta property="og:type" content="website" />
        {/* Twitter Card */}
        <meta name="twitter:title" content="Brackets | MakeABracket.com" />
        <meta
          name="twitter:description"
          content="Peruse the brackets on MakeABracket.com."
        />
        <meta
          name="twitter:image"
          content={
            process.env.NEXT_PUBLIC_SITE_URL + '/Make_A_Bracket_Icon_BonT.png'
          }
        />
        <meta name="twitter:card" content="Brackets on MakeABracket.com." />
      </Head>

      <Component />

      <footer></footer>
    </>
  );
};

Page.getLayout = function getLayout(page) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;
