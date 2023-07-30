import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// import CollectButton from './button/collect';
// import ListItemMenuButton from './button/listItemMenu';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// MUI
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Link as MUILink,
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
} from '@mui/material';

// MUI Lab
import Masonry from '@mui/lab/Masonry';

// Material Icons

// Mui Colors
import { grey } from '@mui/material/colors';

// Types
import type { BracketListing } from '../../../common/types/bracket';

export default function MasonryLayout({
  brackets,
}: {
  brackets: BracketListing[];
}) {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));
  const sm = useMediaQuery(theme.breakpoints.only('sm'));
  const mdLg = useMediaQuery(theme.breakpoints.between('md', 'xl'));
  const xlUp = useMediaQuery(theme.breakpoints.up('xl'));

  return (
    <Masonry
      columns={(xs && 1) || (sm && 2) || (mdLg && 3) || (xlUp && 4) || 1}
      spacing={1}
      sx={{ alignContent: 'start' }}
    >
      {brackets?.map((bracket) => {
        return (
          <Paper key={bracket.id}>
            <Box
              sx={{
                position: 'relative',
                aspectRatio: '16 / 9',
                backgroundColor: grey[400],
              }}
            >
              {/* Bracket Image */}
              {bracket.image && (
                <Image
                  src={bracket.image || ''}
                  alt={`${bracket.name} banner`}
                  fill
                  unoptimized={true}
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              )}
            </Box>
            <Box sx={{ p: 1 }}>
              <MUILink
                component={Link}
                href={`/b/${bracket.slug}/${bracket.id}`}
                variant="h6"
                underline="none"
              >
                {bracket.name}
              </MUILink>
              <Typography>{bracket.description}</Typography>
              {/* <ButtonGroup
                // orientation="vertical"
                variant="outlined"
                aria-label="artist list item buttons"
                fullWidth
                sx={{
                  height: '100%',
                  justifyContent: 'center',
                  mt: 1,
                }}
              >
                <CollectButton
                  collectingBoolean={true}
                  galleryId={bracket.gallery_id}
                  profileType={bracket.profile_type || null}
                  profileId={bracket.profile_id || null}
                />

                <ListItemMenuButton
                  lists={lists}
                  selectedList={selectedList}
                  artistCollectId={bracket.artist_collect_id}
                  setCollection={setCollection}
                  artistListItemId={bracket.artist_list_item_id}
                  profileName={profileName}
                />
              </ButtonGroup> */}
            </Box>
          </Paper>
        );
      }) || <></>}
    </Masonry>
  );
}
