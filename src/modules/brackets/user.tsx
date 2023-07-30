import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import MainLayout from '../../common/layouts/app';
import { useSession, signIn, signOut } from 'next-auth/react';
// Custom Components
import StackLayout from './layout/stack';
import MasonryLayout from './layout/masonry';
// MUI Contexts
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
// MUI
import {
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Container,
  Divider,
  FormControl,
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
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material';
// Mui Colors
import { grey } from '@mui/material/colors';
// Icons
import TableRowsSharpIcon from '@mui/icons-material/TableRowsSharp';
import AutoAwesomeMosaicSharpIcon from '@mui/icons-material/AutoAwesomeMosaicSharp';

// Types
import type { UserBrackets as UserBracketsData } from '../../pages/api/brackets/user';
import type { BracketListing } from '../../common/types/bracket';

export default function UserBrackets() {
  const { data: session, status } = useSession();

  const theme = useTheme();
  let xs = useMediaQuery(theme.breakpoints.only('xs'));
  let smMd = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  let lgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const [brackets, setBrackets] = useState<BracketListing[]>([]);
  const [canLoadMore, setCanLoadMore] = useState(false);
  const [loadMoreNow, setLoadMoreNow] = useState(true);
  const [loadMoreLimit, setLoadMoreLimit] = useState(20); // default 20 even if not sent in query; max 100
  const [masonryLayout, setMasonryLayout] = useState(true);

  useEffect(() => {
    if (!loadMoreNow || status !== 'authenticated') return;
    try {
      (async () => {
        const res = await fetch(
          `/api/brackets/user?offset=${brackets.length}&limit=${loadMoreLimit}`
        );
        const json: UserBracketsData = await res.json();
        if (!('message' in json)) {
          let { brackets: moreBrackets, canLoadMore: updatedCanLoadMore } =
            json;
          setBrackets([...brackets, ...moreBrackets]);
          setCanLoadMore(updatedCanLoadMore);
          setLoadMoreNow(false);
        }
      })();
    } catch (err) {
      console.error(err);
    }
  }, [brackets, loadMoreLimit, loadMoreNow, status]);

  return (
    session && (
      <Box
        component="main"
        sx={{ height: '100%', overflowY: 'auto', p: theme.spacing(1) }}
        onScroll={(e) => {
          if (
            e.currentTarget.scrollTop + e.currentTarget.clientHeight ===
            e.currentTarget.scrollHeight
          ) {
            setLoadMoreNow(() => true);
          }
        }}
      >
        <Typography variant="h1">{session.user.name} Brackets</Typography>
        <Grid container spacing={2} sx={{ mb: theme.spacing(2) }}>
          <Grid item xs={12} sm={6}>
            <Button>Placeholder</Button>
          </Grid>
          <Grid item xs={9} sm={4} xl={5}>
            <ButtonGroup
              variant="outlined"
              aria-label="outlined button group"
              fullWidth
              sx={{ height: '100%' }}
            >
              <Button>Test A</Button>
              <Button>Test B</Button>
            </ButtonGroup>
          </Grid>
          <Grid item xs={3} sm={2} xl={1}>
            <Stack direction="row" sx={{ justifyContent: 'center' }}>
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
    )
  );
}
