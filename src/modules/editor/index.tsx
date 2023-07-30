import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Script from 'next/script';
// UUID
import { v4 as uuidv4 } from 'uuid';
// Components
import NewBracketModal from './modal';
import BracketComponent from '../bracket';
import ParticipantsComponent from './components/participants';
import GamesComponent from './components/games';
import SettingsComponent from './components/settings';
import EmbedComponent from './components/embed';
import Leaderboard from '../leaderboard';
import MembersComponent from './components/members';
// Games
import singleElimination from './bracketTypes/singleElimination';
// MUI Contexts
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSnackbarContext } from '../../common/contexts/mui';
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
  SnackbarProps,
  Stack,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material';
// Material Icons
import AddBoxSharpIcon from '@mui/icons-material/AddBoxSharp';
import FormatListNumberedSharpIcon from '@mui/icons-material/FormatListNumberedSharp';
// Sidebar MUI icons
import GroupsIcon from '@mui/icons-material/Groups';
import CasinoIcon from '@mui/icons-material/Casino';
import PaletteIcon from '@mui/icons-material/Palette';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import SettingsIcon from '@mui/icons-material/Settings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CodeIcon from '@mui/icons-material/Code';
import SaveIcon from '@mui/icons-material/Save';
import StartIcon from '@mui/icons-material/Start';
import JavascriptIcon from '@mui/icons-material/Javascript';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';

// Types
import { SetState } from '../../common/types/react';
import type {
  Bracket,
  NewBracket,
  Settings,
  NewSettings,
  Round,
  NewRound,
  Category,
  Participant,
  NewParticipant,
  Styles as StylesProps,
  NewStyles as NewStylesProps,
} from '../../common/types/bracket';
// declare global variables and functions used by the Google Maps API
declare global {
  interface Window {
    initMap: () => void;
    displaySuggestions: (
      predictions: google.maps.places.QueryAutocompletePrediction[] | null,
      status: google.maps.places.PlacesServiceStatus
    ) => void;
    setLocationSuggestions: React.Dispatch<
      React.SetStateAction<google.maps.places.QueryAutocompletePrediction[]>
    >;
    autocompleteService: google.maps.places.AutocompleteService;
    placesService: google.maps.places.PlacesService;
  }
}
export type NewBracketState = {
  rounds: (participants: NewParticipant[]) => NewRound[];
  check: ({
    settings,
    participants,
    rounds,
    categories,
  }: {
    settings: NewSettings;
    participants: NewParticipant[];
    rounds: NewRound[];
    categories: Category[];
  }) => string[];
};
export type SetNewBracket = SetState<NewBracketState>;
export type SettingsState = NewSettings | Settings;
export type SetSettings = SetState<SettingsState>;
export type ParticipantsState = (NewParticipant | Participant)[];
export type SetParticipants = SetState<ParticipantsState>;
export type RoundsState = Round[] | NewRound[];
export type SetRounds = SetState<RoundsState>;
export type CategoriesState = Category[];
export type SetCategories = SetState<CategoriesState>;
export type NewParticipantObject = (n: string | number) => NewParticipant;

const newParticipantObject: NewParticipantObject = (n) => {
  return {
    key: uuidv4(),
    name: typeof n === 'string' ? n : `Participant ${n}`, // n is a name or number
    ranking: null,
    image: '',
    email: '',
    website: '',
    video: '',
    details: '',
  };
};

let defaultParticipants = [
  newParticipantObject(1),
  newParticipantObject(2),
  newParticipantObject(3),
  newParticipantObject(4),
  // newParticipantObject(5),
  // newParticipantObject(6),
  // newParticipantObject(7),
  // newParticipantObject(8),
  // newParticipantObject(9),
  // newParticipantObject(10),
  // newParticipantObject(11),
  // newParticipantObject(12),
  // newParticipantObject(13),
  // newParticipantObject(14),
  // newParticipantObject(15),
  // newParticipantObject(16),
];

function editorListItems(settings: SettingsState) {
  return [
    {
      key: 'participants',
      text: 'Participants',
      icon: <GroupsIcon />,
    },
    {
      key: 'games',
      text: 'Games',
      icon: <CasinoIcon />,
    },
    // {
    //   key: 'styles',
    //   text: 'Styles',
    //   icon: <PaletteIcon />,
    // },
    ...('id' in settings && !settings.bracket_type.includes('voting')
      ? [
          {
            key: 'leaderboard',
            text: 'Leaderboard',
            icon: <ThumbUpIcon />,
          },
        ]
      : []),
    {
      key: 'settings',
      text: 'Settings',
      icon: <SettingsIcon />,
    },
    // {
    //   key: 'analytics',
    //   text: 'Analytics',
    //   icon: <AnalyticsIcon />,
    // },
    ...('id' in settings
      ? [
          {
            key: 'embed',
            text: 'Embed',
            icon: <CodeIcon />,
          },
        ]
      : []),
    ...('id' in settings
      ? [
          {
            key: 'members',
            text: 'Members',
            icon: <InsertEmoticonIcon />,
          },
        ]
      : []),
  ];
}

// const editorListItems = [
//   {
//     text: 'Participants',
//     icon: <GroupsIcon />,
//   },
//   {
//     text: 'Games',
//     icon: <CasinoIcon />,
//   },
//   {
//     text: 'Styles',
//     icon: <PaletteIcon />,
//   },
//   {
//     text: 'Votes / Predictions',
//     icon: <ThumbUpIcon />,
//   },
//   {
//     text: 'Settings',
//     icon: <SettingsIcon />,
//   },
//   {
//     text: 'Analytics',
//     icon: <AnalyticsIcon />,
//   },
//   {
//     text: 'Embed',
//     icon: <CodeIcon />,
//   },
// ];

const defaultSettings = {
  published: false,
  publish_timestamp: null,
  bracket_type: 'single-elimination-voting',
  name: 'My Bracket Tournament',
  slug: 'my-bracket-tournament',
  image: '',
  description: '',
  rules: '',
  visibility: true,
  restricted: false,
  location: null,
  // previewImage: null,
  // privacy: 'public',
  // status: 'draft',
  // creationSource: 'website',
  // planFeatures: {},
  // modelVersion: 1,
  // sportType: 'default',
  // cellsWidth: 220,
  // enableSignup: false,
  // enableScoresSubmission: false,
  // enableChampionView: false,
  // height: 500,
  // scoresWidth: 35,
  // share: {
  //   hide: false,
  //   url: '',
  // },
  // showDates: true,
  // showFullscreenButton: false,
  // showZoomButton: false,
  // showRoundTitle: false,
  // showGroupName: false,
  // showFinalWinner: false,
  // showScores: true,
  // showTitle: true,
  // showGameNumbers: false,
  // showGameLocations: false,
  // showStandingsTable: false,
  // showParticipantsTable: false,
  // showRankingTable: false,
  // showParticipantRanking: false,
  // showPrizes: false,
  // showRules: true,
  // include3rdPlaceMatch: false,
  // timezone: 'America/Chicago',
  // dateFormat: 'MM/dd/yyyy',
  // timeFormat: 'hh:mm a z',
  // prizes: null,
  // votingSettings: null,
  // standingTableSettings: null,
  // signupPageSettings: null,
  // autoRefresh: null,
};

const defaultStyles = {
  background: {
    size: 'cover',
    image: null,
    transparent: false,
  },
  colors: {
    background: 'ffffff',
    games: 'ffffff',
    participants: '454545',
    borders: 'cccccc',
    title: '000000',
    text: '454545',
    buttonBackground: 'cccccc',
    buttonText: '454545',
    roundBackground: 'cccccc',
    roundText: '454545',
    tabText: '454545',
    activeTabBackground: 'cccccc',
    activeTabText: '454545',
    dates: '000000',
    locations: '000000',
    tableBackground: 'dfdfdf',
    tableText: '1c242a',
  },
  layoutId: 'default',
  fontId: 'default',
  customCSS: '',
};

export default function BracketEditor({
  bracketData,
}: {
  bracketData?: Bracket;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const theme = useTheme();
  const snackbar = useSnackbarContext();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));

  // Default newBracket object singleElimination used for both regular & voting bracket types
  const [newBracket, setNewBracket] = useState<NewBracketState>(
    () => singleElimination
  );
  // newBracket.rounds(participants) returns rounds array
  // newBracket.check({ settings, participants, rounds, styles }) performs error checking and returns an array of error message strings
  const [participants, setParticipants] = useState<ParticipantsState>(
    () => bracketData?.participants || defaultParticipants
  );
  const [rounds, setRounds] = useState<RoundsState>(
    bracketData?.rounds || newBracket.rounds(participants)
  );
  const [settings, setSettings] = useState<SettingsState>(
    () => bracketData?.settings || defaultSettings
  );
  // const [styles, setStyles] = useState<StylesProps | NewStylesProps>(
  //   bracketData?.styles || defaultStyles
  // );

  const [categories, setCategories] = useState<CategoriesState>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // Editor list
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  // NewBracketModal state
  const [openNewBracketModal, setOpenNewBracketModal] = useState<boolean>(
    'id' in settings ? false : true
  );
  const handleOpenNewBracketModal = () => setOpenNewBracketModal(true);
  const handleCloseNewBracketModal = () => setOpenNewBracketModal(false);

  // Disable the Start Bracket button
  const [startDisabled, setStartDisabled] = useState(false);

  const timeoutRef = useRef();

  const [initMapLoaded, setInitMapLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'loading' || !router.isReady) return;
    (async () => {
      let res = await fetch('/api/categories/all');
      let cats: Category[] = await res.json();
      setAllCategories(() => cats);
      // If you provide a rich object, the reference has to match. https://github.com/mui/material-ui/issues/16775
      setCategories(() => {
        if (bracketData?.categories) {
          return cats.filter(
            (cat) =>
              bracketData?.categories.findIndex((c) => c.id === cat.id) > -1
          );
        } else return [];
      });
    })();

    window.initMap = () => {
      window.displaySuggestions = function (predictions, status) {
        if (
          status != window.google.maps.places.PlacesServiceStatus.OK ||
          !predictions
        ) {
          return snackbar.pushSnack({
            children: (
              <Alert
                variant="filled"
                onClose={snackbar.handleClose}
                severity="error"
                // sx={{ width: '100%' }}
              >
                {status}
              </Alert>
            ),
          });
        }
        window.setLocationSuggestions(() => predictions);
      };

      window.autocompleteService =
        new window.google.maps.places.AutocompleteService();
      window.placesService = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
    };
    setInitMapLoaded(true);
  }, [bracketData?.categories, router.isReady, snackbar, status]);

  function warningSnacks(messages: string[]) {
    return messages.map((message) => {
      return {
        children: (
          <Alert
            variant="filled"
            onClose={snackbar.handleClose}
            severity="error"
            sx={{ width: '100%' }}
          >
            {message}
          </Alert>
        ),
      };
    });
  }

  async function createBracket({
    settings,
    participants,
    rounds,
    // styles,
    categories,
  }: NewBracket) {
    setStartDisabled(() => true);
    let errors = newBracket.check({
      settings,
      participants,
      rounds,
      // styles,
      categories,
    });
    if (errors.length > 0) {
      snackbar.pushSnacks(warningSnacks(errors));
      setStartDisabled(() => false);
      return;
    }
    let res = await fetch('/api/bracket/create', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        settings,
        participants,
        rounds,
        // styles,
        categories,
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
            Bracket created.
          </Alert>
        ),
      });
      const bracket = await res.json();
      router.push(`/b/${bracket.slug}/${bracket.id}`);
    } else {
      snackbar.pushSnack({
        children: (
          <Alert
            variant="filled"
            onClose={snackbar.handleClose}
            severity="error"
            // sx={{ width: '100%' }}
          >
            Could not create bracket.
          </Alert>
        ),
      });
      setStartDisabled(() => false);
    }
  }

  function saveClick() {
    createBracket({
      settings: settings,
      participants: participants,
      rounds: rounds,
      // styles: styles,
      categories: categories,
    });
  }

  async function startClick() {
    // If creating a new bracket, this button will publish AND create the bracket
    if (!('id' in settings)) {
      const publishedSettings = { ...settings };
      publishedSettings.published = true;
      createBracket({
        settings: publishedSettings,
        participants: participants,
        rounds: rounds,
        // styles: styles,
        categories: categories,
      });
    }

    // If editing a saved bracket, this will ONLY update the "published" value
    // if (router.pathname.endsWith('/edit')) {
    if ('id' in settings) {
      setSelectedIndex(null);
      let res = await fetch('/api/bracket/edit/settings/publish', {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          bracket_id: settings.id,
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
              Bracket published.
            </Alert>
          ),
        });
        setSettings((prev) => {
          let updatedSettings = { ...prev };
          updatedSettings.published = true;
          return updatedSettings;
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
              Could not publish bracket.
            </Alert>
          ),
        });
      }
    }
  }

  function MenuGrid() {
    if (xs) {
      return (
        <Stack direction="row" sx={{ overflow: 'auto' }}>
          {editorListItems(settings).map((item, index) => {
            return (
              <IconButton
                key={item.key}
                size="large"
                onClick={(e) => {
                  if (selectedIndex === item.key) {
                    return setSelectedIndex(null);
                  } else setSelectedIndex(item.key);
                }}
              >
                {item.icon}
              </IconButton>
            );
          })}
          {/* Save Tournament */}
          {!('id' in settings) && (
            <IconButton
              size="large"
              disabled={startDisabled}
              onClick={saveClick}
            >
              <SaveIcon />
            </IconButton>
          )}
          {/* Start Tournament */}
          {settings?.published === false && (
            <IconButton
              size="large"
              disabled={startDisabled}
              onClick={startClick}
            >
              <StartIcon />
            </IconButton>
          )}
        </Stack>
      );
    } else {
      return (
        <Grid xs="auto" sx={{ height: '100%' }}>
          <List sx={{ height: '100%', overflow: 'auto' }}>
            {editorListItems(settings).map((item, index) => {
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={selectedIndex === item.key}
                    onClick={(e) => {
                      if (selectedIndex === item.key) {
                        return setSelectedIndex(null);
                      } else setSelectedIndex(item.key);
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              );
            })}
            {/* Save Tournament */}
            {!('id' in settings) && (
              // We edit different parts of the bracket individually
              // so this button is more of a "Create Bracket" button
              // and only shows up when creating a new bracket on /new
              <ListItem disablePadding>
                <ListItemButton disabled={startDisabled} onClick={saveClick}>
                  <ListItemIcon>
                    <SaveIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={startDisabled ? 'Loading' : 'Save Tournament'}
                  />
                </ListItemButton>
              </ListItem>
            )}
            {/* Start Tournament */}
            {settings?.published === false && (
              // Only show on unpublished brackets
              <ListItem disablePadding>
                <ListItemButton
                  color="primary"
                  disabled={startDisabled}
                  onClick={startClick}
                >
                  <ListItemIcon>
                    {/* {new Date() } */}
                    <StartIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={startDisabled ? 'Loading' : 'Start Tournament'}
                  />
                </ListItemButton>
              </ListItem>
            )}
            {/* <ListItem disablePadding>
              <ListItemButton
                onClick={() => console.log('participants', participants)}
              >
                <ListItemIcon>
                  <JavascriptIcon />
                </ListItemIcon>
                <ListItemText primary="participants" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => console.log('rounds', rounds)}>
                <ListItemIcon>
                  <JavascriptIcon />
                </ListItemIcon>
                <ListItemText primary="rounds" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => console.log('settings', settings)}>
                <ListItemIcon>
                  <JavascriptIcon />
                </ListItemIcon>
                <ListItemText primary="settings" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => console.log('categories', categories)}
              >
                <ListItemIcon>
                  <JavascriptIcon />
                </ListItemIcon>
                <ListItemText primary="categories" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => console.log('member', bracketData?.member)}
              >
                <ListItemIcon>
                  <JavascriptIcon />
                </ListItemIcon>
                <ListItemText primary="member" />
              </ListItemButton>
            </ListItem> */}
          </List>
        </Grid>
      );
    }
  }

  return (
    <>
      <Grid
        container
        direction={xs ? 'column' : 'row'}
        sx={{ height: { xs: 'auto', md: '100%' } }}
      >
        <MenuGrid />
        {selectedIndex === 'participants' && (
          <Grid
            xs={12}
            sm
            md={3}
            xl={2}
            sx={{
              flexGrow: { xs: 'inherit', sm: 1, md: 'inherit' },
              height: { xs: 'auto', sm: '100%' },
              overflow: 'auto',
              p: 1,
            }}
          >
            <ParticipantsComponent
              participants={participants}
              setParticipants={setParticipants}
              newParticipantObject={newParticipantObject}
              newBracket={newBracket}
              setRounds={setRounds}
            />
          </Grid>
        )}
        {selectedIndex === 'games' && (
          <Grid
            xs={12}
            sm
            md={3}
            xl={2}
            sx={{
              flexGrow: { xs: 'inherit', sm: 1, md: 'inherit' },
              height: { xs: 'auto', sm: '100%' },
              overflow: 'auto',
              p: 1,
            }}
          >
            <GamesComponent
              settings={settings}
              participants={participants}
              setParticipants={setParticipants}
              rounds={rounds}
              setRounds={setRounds}
            />
          </Grid>
        )}
        {'id' in settings && selectedIndex === 'leaderboard' && (
          <Grid
            xs={12}
            sm
            md={3}
            xl={2}
            sx={{
              flexGrow: { xs: 'inherit', sm: 1, md: 'inherit' },
              height: { xs: 'auto', sm: '100%' },
              overflow: 'auto',
              p: theme.spacing(1),
            }}
          >
            <Leaderboard bracket_id={settings.id} />
          </Grid>
        )}
        {selectedIndex === 'settings' && (
          <Grid
            xs={12}
            sm
            md={3}
            xl={2}
            sx={{
              flexGrow: { xs: 'inherit', sm: 1, md: 'inherit' },
              height: { xs: 'auto', sm: '100%' },
              overflow: 'auto',
              p: theme.spacing(1),
            }}
          >
            <SettingsComponent
              settings={settings}
              setSettings={setSettings}
              rounds={rounds}
              setRounds={setRounds}
              setNewBracket={setNewBracket}
              categories={categories}
              setCategories={setCategories}
              allCategories={allCategories}
            />
          </Grid>
        )}
        {'id' in settings && selectedIndex === 'embed' && (
          <Grid
            xs={12}
            sm
            md={3}
            xl={2}
            sx={{
              flexGrow: { xs: 'inherit', sm: 1, md: 'inherit' },
              height: { xs: 'auto', sm: '100%' },
              overflow: 'auto',
              p: theme.spacing(1),
            }}
          >
            <EmbedComponent bracket_id={settings.id} />
          </Grid>
        )}
        {'id' in settings &&
          bracketData &&
          bracketData.member !== null &&
          selectedIndex === 'members' && (
            <Grid
              xs={12}
              sm
              md={3}
              xl={2}
              sx={{
                flexGrow: { xs: 'inherit', sm: 1, md: 'inherit' },
                height: { xs: 'auto', sm: '100%' },
                overflow: 'auto',
                p: theme.spacing(1),
              }}
            >
              <MembersComponent
                bracket_id={settings.id}
                sessionMember={bracketData.member}
              />
            </Grid>
          )}
        <Grid
          xs={12}
          md
          sx={{
            overflow: 'auto',
            height: { xs: 'auto', md: '100%' },
          }}
        >
          <BracketComponent
            rounds={rounds}
            participants={participants}
            settings={settings}
          />
        </Grid>
      </Grid>
      {initMapLoaded && (
        <Script
          strategy="lazyOnload"
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_MAPS_API_KEY}&libraries=places&callback=initMap`}
          onLoad={() => {
            console.log('Script has loaded');
          }}
        ></Script>
      )}
      {openNewBracketModal && (
        <NewBracketModal
          open={openNewBracketModal}
          handleClose={handleCloseNewBracketModal}
          newParticipantObject={newParticipantObject}
          participants={participants}
          setParticipants={setParticipants}
          settings={settings}
          setSettings={setSettings}
          newBracket={newBracket}
          setRounds={setRounds}
        />
      )}
    </>
  );
}
