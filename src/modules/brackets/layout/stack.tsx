import { useState, useEffect } from 'react';
import Link from 'next/link';

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

// Types
import type { BracketListing } from '../../../common/types/bracket';

export default function StackLayout({
  brackets,
}: {
  brackets: BracketListing[];
}) {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));

  return (
    <Stack spacing={2}>
      {brackets?.map((bracket) => {
        return (
          <Paper key={bracket.id} sx={{ p: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={9} md={10}>
                <MUILink
                  component={Link}
                  href={`/b/${bracket.slug}/${bracket.id}`}
                  variant="h6"
                  underline="none"
                >
                  {bracket.name}
                </MUILink>

                {<Typography>{bracket.description}</Typography>}
              </Grid>
              {/* <Grid item xs={12} sm={3} md={2}>
                <ButtonGroup
                  orientation="vertical"
                  variant="outlined"
                  aria-label="artist list buttons"
                  fullWidth
                  sx={{ height: '100%', justifyContent: 'center' }}
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
                </ButtonGroup>
              </Grid> */}
            </Grid>
          </Paper>
        );
      })}
    </Stack>
  );
}
