import { useState, useRef, useEffect, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

import mabLogo from '../../../public/Logo_cocepts_MAB-3.png';

// Utils
import { useSession, signIn, signOut, getSession } from 'next-auth/react';

// Custom components

// Static images

// MUI contexts
import { styled, useTheme } from '@mui/material/styles';
import { useColorModeContext } from '../contexts/mui';

// MUI custom components

// MUI standard components
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  Container,
  Drawer,
  Divider,
  Unstable_Grid2 as Grid,
  IconButton,
  InputAdornment,
  Link as MUILink,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  SvgIcon,
  Toolbar,
  Typography,
  TextField,
  useMediaQuery,
} from '@mui/material';

// AppBar icons
import AddIcon from '@mui/icons-material/Add';

// Drawer icons
import MenuIcon from '@mui/icons-material/Menu';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import CasinoIcon from '@mui/icons-material/Casino';
import CategoryIcon from '@mui/icons-material/Category';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import DevicesIcon from '@mui/icons-material/Devices';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import FolderIcon from '@mui/icons-material/Folder';

// ###################################
// ###### MUI STYLED COMPONENTS ######
// ###################################

// ###################################
// ########### MAIN LAYOUT ###########
// ###################################

export default function MainLayout(props: { children: React.ReactNode }) {
  const router = useRouter();
  const theme = useTheme();
  const { data: session, status, update } = useSession();
  const colorMode = useColorModeContext();

  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));

  // Drawer
  const drawerWidth = 240;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Left Nav links Array
  const drawerItems = [
    // {
    //   link: null,
    //   text: 'Create',
    //   icon: (
    //     <SvgIcon>
    //       <g id="Layer_3">
    //         <rect
    //           x="11.2"
    //           y="1.2"
    //           width="1.2"
    //           height="21.1"
    //           style={{ fill: '#F57C00' }}
    //         />
    //         <rect
    //           x="8.3"
    //           y="2.4"
    //           width="7"
    //           height="1.2"
    //           style={{ fill: '#FFB74D' }}
    //         />
    //         <polygon
    //           points="20,24.1 18.8,24.1 14.1,0 15.5,0 	"
    //           style={{ fill: '#FFB74D' }}
    //         />
    //         <polygon
    //           points="4.7,24.1 3.6,24.1 8.3,0 9.4,0 	"
    //           style={{ fill: '#FFB74D' }}
    //         />
    //         <rect
    //           x="3"
    //           y="17.1"
    //           width="17.6"
    //           height="1.2"
    //           style={{ fill: '#FFCC80' }}
    //         />
    //         <rect
    //           x="5.9"
    //           y="6.5"
    //           width="11.9"
    //           height="10.6"
    //           style={{ fill: '#B3E5FC' }}
    //         />
    //       </g>
    //     </SvgIcon>
    //   ),
    // },

    {
      onClick: () => setDrawerOpen(false),
      text: 'Home',
      icon: <HomeOutlinedIcon />,
      link: '/',
    },
    ...(mdDown
      ? [
          {
            onClick: () => setDrawerOpen(false),
            text: 'Brackets',
            icon: <CasinoIcon />,
            link: '/brackets',
          },
        ]
      : []),
    {
      onClick: () => {
        !session && signIn();
        setDrawerOpen(false);
      },
      text: session ? 'Profile' : 'Login',
      icon: <PersonOutlinedIcon />,
      link: session && '/profile',
    },
    ...(session
      ? [
          {
            onClick: () => {
              setDrawerOpen(false);
            },
            text: 'User Brackets',
            icon: <FolderIcon />,
            link: '/profile/brackets',
          },
        ]
      : []),
  ];

  const drawer = (
    <Box>
      <Toolbar />
      <Divider />
      <List sx={{ p: 0, overflowX: 'hidden', overflowY: 'auto' }}>
        {smDown && (
          <ListItem disablePadding>
            <ListItemButton
              LinkComponent={Link}
              href="/new"
              onClick={() => setDrawerOpen(false)}
              sx={{ backgroundColor: theme.palette.primary.main }}
            >
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary="Make a Bracket" />
            </ListItemButton>
          </ListItem>
        )}
        {/* {true && (
          <Button
            fullWidth
            size="large"
            LinkComponent={Link}
            href="/new"
            variant="contained"
            startIcon={<AddIcon />}
            // sx={{
            //   color: 'white',
            //   borderColor: 'white',
            //   lineHeight: 0,
            //   ':hover': {
            //     color: 'black',
            //     borderColor: 'black',
            //   },
            // }}
          >
            Make a Bracket
          </Button>
        )} */}
        {drawerItems.map((item, index) => (
          <Fragment key={item.text}>
            {item.text === 'Profile' && <Divider />}
            <ListItem disablePadding>
              <ListItemButton
                {...(item.link && { LinkComponent: Link })}
                {...(item.link && { href: item.link })}
                onClick={() => {
                  {
                    item.onClick && item.onClick();
                  }
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          </Fragment>
        ))}
        <Divider />
        <ListItem disablePadding>
          <ListItemButton
            onClick={async () => {
              try {
                // Rotation: System > Light > Dark
                let res;
                if (colorMode?.getMode() === null) {
                  // System preference > light mode
                  colorMode?.setLight();
                  if (status === 'authenticated') {
                    res = await fetch('/api/user/edit/colorMode', {
                      method: 'PUT',
                      headers: {
                        'Content-type': 'application/json',
                      },
                      body: JSON.stringify({
                        color_mode: 'light',
                      }),
                    });
                    if (res.status !== 200) {
                      return colorMode?.setSystemPreference();
                    } else
                      update({
                        color_mode: 'light',
                      });
                  }
                } else if (colorMode?.getMode() === 'light') {
                  // Light mode > dark mode
                  colorMode?.setDark();
                  if (status === 'authenticated') {
                    res = await fetch('/api/user/edit/colorMode', {
                      method: 'PUT',
                      headers: {
                        'Content-type': 'application/json',
                      },
                      body: JSON.stringify({
                        color_mode: 'dark',
                      }),
                    });
                    if (res.status !== 200) {
                      return colorMode?.setLight();
                    } else
                      update({
                        color_mode: 'dark',
                      });
                  }
                } else if (colorMode?.getMode() === 'dark') {
                  // Dark mode > system preference
                  colorMode?.setSystemPreference();
                  if (status === 'authenticated') {
                    res = await fetch('/api/user/edit/colorMode', {
                      method: 'PUT',
                      headers: {
                        'Content-type': 'application/json',
                      },
                      body: JSON.stringify({
                        color_mode: null,
                      }),
                    });
                    if (res.status !== 200) {
                      return colorMode?.setDark();
                    } else {
                      update({
                        color_mode: null,
                      });
                    }
                  }
                }
              } catch (err) {
                console.error(err);
              }
            }}
          >
            <ListItemIcon>
              {colorMode?.getMode() === null ? (
                <DevicesIcon />
              ) : colorMode?.getMode() === 'dark' ? (
                <DarkModeIcon />
              ) : (
                <DarkModeOutlinedIcon />
              )}
            </ListItemIcon>
            <ListItemText primary="Dark Mode" />
          </ListItemButton>
        </ListItem>
        <Divider />
        {session && (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                signOut();
                setDrawerOpen(false);
              }}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <Stack sx={{ height: '100%' }}>
        <AppBar position="relative" sx={{ maxHeight: '75px' }}>
          <Toolbar /* variant="dense" */>
            <Link href="/" style={{ display: 'contents' }}>
              <Image
                src={mabLogo}
                alt="Make a Bracket Logo"
                style={{ height: '69%', width: 'auto' }}
                priority
              />
            </Link>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="space-between"
              sx={{ ml: 'auto' }}
            >
              {mdUp && (
                <>
                  {/* <Button
                    LinkComponent={Link}
                    href="/brackets"
                    variant="text"
                    sx={{
                      color: theme.palette.common.white,
                      ':hover': {
                        color: theme.palette.common.white,
                      },
                    }}
                  >
                    Brackets
                  </Button> */}
                  <MUILink
                    component={Link}
                    href="/brackets"
                    variant="button"
                    underline="none"
                    sx={{
                      px: 1,
                      color: theme.palette.common.white,
                      lineHeight: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ':hover': {
                        color:
                          theme.palette.mode === 'dark'
                            ? theme.palette.primary.main
                            : theme.palette.common.black,
                      },
                    }}
                  >
                    Brackets
                  </MUILink>
                </>
              )}
              {smUp && (
                <MUILink
                  component={Link}
                  href="/new"
                  variant="button"
                  underline="none"
                  sx={{
                    border: `1px solid ${theme.palette.common.white}`,
                    px: 1,
                    color: theme.palette.common.white,
                    lineHeight: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ':hover': {
                      // color:
                      //   theme.palette.mode === 'dark'
                      //     ? theme.palette.primary.main
                      //     : theme.palette.common.black,
                      borderColor:
                        theme.palette.mode === 'dark'
                          ? theme.palette.primary.main
                          : theme.palette.common.black,
                    },
                  }}
                >
                  <AddIcon fontSize="small" sx={{ mr: 0.5 }} /> Make a Bracket
                </MUILink>
              )}
              <IconButton
                color="inherit"
                aria-label="drawer toggle"
                edge="end"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>
        {/* Main part of website */}
        <Box sx={{ overflow: 'auto', width: '100%', flexGrow: 1 }}>
          {props.children}
        </Box>
      </Stack>
      {/* Hidden until the menu is clicked */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          // display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
