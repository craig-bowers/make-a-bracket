import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Fragment,
} from 'react';

import { useRouter } from 'next/router';
import Script from 'next/script';

import singleElimination from '../../bracketTypes/singleElimination';
import DeleteBracketModal from './deleteModal';

// MUI Theme
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSnackbarContext } from '../../../../common/contexts/mui';

import { grey } from '@mui/material/colors';

// Dates
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

// MUI
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
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
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  SxProps,
  Theme,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material';

// Material Icons
import PublicIcon from '@mui/icons-material/Public';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import GoogleIcon from '@mui/icons-material/Google';
import DeleteIcon from '@mui/icons-material/Delete';

import type {
  BracketTypes,
  Settings,
  NewSettings,
  Round,
  NewRound,
  Category,
  Location,
} from '../../../../common/types/bracket';
import {
  SettingsState,
  SetSettings,
  RoundsState,
  SetRounds,
  SetNewBracket,
  CategoriesState,
  SetCategories,
} from '../..';
type SettingsProps = {
  settings: SettingsState;
  setSettings: SetSettings;
  rounds: RoundsState;
  setRounds: SetRounds;
  setNewBracket: SetNewBracket;
  categories: CategoriesState;
  setCategories: SetCategories;
  allCategories: CategoriesState;
};

export function getSlug(string: string) {
  return string
    .replace(/[^A-Za-z0-9_-\s]/g, '')
    .trim()
    .replace(/\W+/g, '-')
    .toLowerCase();
}

function checkBracketTypeString(string: string): BracketTypes {
  let bracketTypeString: BracketTypes;
  switch (string) {
    case 'single-elimination':
    case 'single-elimination-rounds':
    case 'single-elimination-voting':
      bracketTypeString = string;
      break;
    default:
      bracketTypeString = 'single-elimination';
      break;
  }
  return bracketTypeString;
}

export default function SettingsComponent({
  settings,
  setSettings,
  rounds,
  setRounds,
  setNewBracket,
  categories,
  setCategories,
  allCategories,
}: SettingsProps) {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));
  const router = useRouter();
  const snackbar = useSnackbarContext();

  const timeoutRef = useRef<NodeJS.Timeout>();

  const [bracketType, setBracketType] = useState<BracketTypes>(
    checkBracketTypeString(settings.bracket_type)
  );
  const [name, setName] = useState(settings?.name || 'My Bracket Tournament');
  const [slug, setSlug] = useState(settings?.slug || getSlug(settings?.name));
  const [deadline, setDeadline] = useState<Date | string | null>(() => {
    if (settings.bracket_type === 'single-elimination') {
      return rounds[0]?.timestamp_end
        ? new Date(rounds[0].timestamp_end)
        : null;
    } else return null;
  });
  const [image, setImage] = useState(settings?.image || '');
  const [description, setDescription] = useState(settings?.description || '');
  const [rules, setRules] = useState(settings?.rules || '');
  const [publishTimestamp, setPublishTimestamp] = useState(() =>
    settings?.publish_timestamp ? new Date(settings.publish_timestamp) : null
  );
  const [visibility, setVisibility] = useState<boolean>(
    settings?.visibility || true
  );
  const [restricted, setRestricted] = useState<boolean>(
    settings?.restricted || false
  );
  const [published, setPublished] = useState<boolean>(
    settings?.published || false
  );

  // Google Maps
  const [locationSuggestions, setLocationSuggestions] = useState<
    google.maps.places.QueryAutocompletePrediction[]
  >([]);
  const [location, setLocation] = useState<
    google.maps.places.QueryAutocompletePrediction | string | null
  >(settings?.location?.name || settings?.location?.formatted_address || null);
  const [locationInput, setLocationInput] = useState('');
  const [sessionToken, setSessionToken] = useState<
    google.maps.places.AutocompleteSessionToken | undefined
  >();
  const locationRef = useRef();

  // useEffect(() => {
  //   if (!sessionToken) {
  //     setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
  //   }
  // }, [sessionToken]);

  function menuItemProps(category: Category) {
    if (category.parent_id === null) {
      let props: SxProps = {
        backgroundColor: theme.palette.primary.main,
      };
      return props;
    }
    return {};
  }

  function getBracketType(bracketTypeString: BracketTypes) {
    switch (bracketTypeString) {
      case 'single-elimination':
        setRounds((prev) => {
          let roundTimeFix = JSON.parse(JSON.stringify(prev));
          let bracketDeadline = roundTimeFix[0].timestamp_end;
          for (let round of roundTimeFix) {
            round.timestamp_start = null;
            round.timestamp_end = bracketDeadline;
          }
          return roundTimeFix;
        });
        setDeadline(() => rounds[0].timestamp_end);
      case 'single-elimination-rounds':
      case 'single-elimination-voting':
      default:
        return singleElimination;
    }
  }

  // NewBracketModal state
  const [openDeleteBracketModal, setOpenDeleteBracketModal] = useState(false);
  const handleOpenDeleteBracketModal = () => setOpenDeleteBracketModal(true);
  const handleCloseDeleteBracketModal = () => setOpenDeleteBracketModal(false);

  return (
    <>
      <Stack spacing={2} py={1}>
        {/* Save button (if editing) */}
        {'id' in settings && (
          <Button
            variant="contained"
            onClick={async () => {
              let res = await fetch('/api/bracket/edit/settings', {
                method: 'PUT',
                headers: {
                  'Content-type': 'application/json',
                },
                body: JSON.stringify({
                  settings,
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
                      Bracket settings updated.
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
                      Could not update bracket settings.
                    </Alert>
                  ),
                });
              }
            }}
          >
            Save
          </Button>
        )}
        {/* Bracket Type */}
        <FormControl>
          <InputLabel id={`settings-bracket-type-select-label`}>
            Bracket Type
          </InputLabel>
          <Select
            disabled={router?.asPath.includes('/edit')}
            labelId={`settings-bracket-type-select-label`}
            id={`settings-bracket-type-select`}
            value={bracketType || ''}
            label="Bracket Type"
            onChange={(e) => {
              const bracketTypeString = checkBracketTypeString(e.target.value);
              setBracketType(() => bracketTypeString);
              setNewBracket(() => getBracketType(bracketTypeString));
              clearTimeout(timeoutRef.current);
              timeoutRef.current = setTimeout(() => {
                setSettings((prev) => {
                  let updatedSettings = { ...prev };
                  updatedSettings.bracket_type = bracketTypeString;
                  return updatedSettings;
                });
              }, 500);
            }}
          >
            <MenuItem value="single-elimination">Single Elimination</MenuItem>
            <MenuItem value="single-elimination-rounds">
              Single Elimination - Round by Round
            </MenuItem>
            <MenuItem value="single-elimination-voting">
              Single Elimination - Voting
            </MenuItem>
          </Select>
        </FormControl>
        {/* Bracket Name */}
        <TextField
          type="text"
          fullWidth={true}
          label="Bracket Name"
          value={name}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setName(() => e.target.value);
            const newSlug = getSlug(e.target.value);
            setSlug(() => newSlug);
            timeoutRef.current = setTimeout(() => {
              setSettings((prev) => {
                let updatedSettings = { ...prev };
                updatedSettings.name = e.target.value;
                updatedSettings.slug = newSlug;
                return updatedSettings;
              });
            }, 500);
          }}
        />
        {/* Bracket Slug */}
        <TextField
          type="text"
          fullWidth={true}
          label={slug ? 'Slug' : 'Slug (required)'}
          value={slug}
          error={!slug ? true : false}
          onChange={(e) => {
            let filteredInput = getSlug(e.target.value);
            clearTimeout(timeoutRef.current);
            setSlug(() => filteredInput);
            timeoutRef.current = setTimeout(() => {
              setSettings((prev) => {
                let updatedSettings = { ...prev };
                updatedSettings.slug = filteredInput;
                return updatedSettings;
              });
            }, 500);
          }}
        />
        {/* Deadline (sets all round.timestamp_end values to be this timestamp) */}
        {settings?.bracket_type === 'single-elimination' && (
          <DateTimePicker
            label="Picks Deadline"
            // inputFormat="MM/dd/yyyy"
            value={deadline}
            onChange={(dateObj) => {
              clearTimeout(timeoutRef.current);
              setDeadline(() => dateObj);
              timeoutRef.current = setTimeout(() => {
                setRounds((prev) => {
                  let updatedRounds: RoundsState = JSON.parse(
                    JSON.stringify(prev)
                  );
                  for (let round of updatedRounds) {
                    if (typeof dateObj === 'string') {
                      round.timestamp_end = dateObj;
                    } else {
                      round.timestamp_end = dateObj?.toUTCString() || null;
                    }
                  }
                  return updatedRounds;
                });
              }, 500);
            }}
          />
        )}
        {/* Image */}
        <TextField
          type="url"
          fullWidth={true}
          label="Image URL"
          value={image}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setImage(() => e.target.value);
            timeoutRef.current = setTimeout(() => {
              setSettings((prev) => {
                let updatedSettings = { ...prev };
                updatedSettings.image = e.target.value;
                return updatedSettings;
              });
            }, 500);
          }}
        />
        {/* Description */}
        <TextField
          type="text"
          fullWidth={true}
          label="Description"
          multiline
          maxRows={4}
          value={description}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setDescription(() => e.target.value);
            timeoutRef.current = setTimeout(() => {
              setSettings((prev) => {
                let updatedSettings = { ...prev };
                updatedSettings.description = e.target.value;
                return updatedSettings;
              });
            }, 500);
          }}
        />
        {/* Rules & Terms */}
        <TextField
          type="text"
          fullWidth={true}
          label="Rules & Terms"
          multiline
          maxRows={4}
          value={rules}
          onChange={(e) => {
            clearTimeout(timeoutRef.current);
            setRules(() => e.target.value);
            timeoutRef.current = setTimeout(() => {
              setSettings((prev) => {
                let updatedSettings = { ...prev };
                updatedSettings.rules = e.target.value;
                return updatedSettings;
              });
            }, 500);
          }}
        />
        {/* Publish Timestamp */}
        <DateTimePicker
          label="Publish Time (schedule)"
          // inputFormat="MM/dd/yyyy"
          value={publishTimestamp}
          onChange={(dateObj) => {
            clearTimeout(timeoutRef.current);
            setPublishTimestamp(() => dateObj);
            timeoutRef.current = setTimeout(() => {
              setSettings((prev) => {
                let updatedSettings = { ...prev };
                if (typeof dateObj === 'string') {
                  updatedSettings.publish_timestamp = dateObj;
                } else {
                  updatedSettings.publish_timestamp =
                    dateObj?.toUTCString() || null;
                }
                return updatedSettings;
              });
            }, 500);
          }}
        />
        {/* Visibility */}
        <Button
          variant="outlined"
          startIcon={visibility ? <PublicIcon /> : <VisibilityOffIcon />}
          endIcon={<Switch checked={visibility} />}
          sx={{
            justifyContent: 'space-between',
            '.MuiSwitch-switchBase:hover': {
              backgroundColor: 'transparent',
            },
          }}
          onClick={(e) => {
            const visibilityValue = !visibility;
            setVisibility(() => visibilityValue);
            setSettings((prev) => {
              let updatedSettings = { ...prev };
              updatedSettings.visibility = visibilityValue;
              return updatedSettings;
            });
          }}
        >
          Visibility
        </Button>
        {/* Restricted */}
        <Button
          variant="outlined"
          startIcon={restricted ? <LockIcon /> : <LockOpenIcon />}
          endIcon={<Switch checked={restricted} />}
          sx={{
            justifyContent: 'space-between',
            '.MuiSwitch-switchBase:hover': {
              backgroundColor: 'transparent',
            },
          }}
          onClick={(e) => {
            const restrictedValue = !restricted;
            setRestricted(() => restrictedValue);
            setSettings((prev) => {
              let updatedSettings = { ...prev };
              updatedSettings.restricted = restrictedValue;
              return updatedSettings;
            });
          }}
        >
          Restricted
        </Button>
        {/* Categories */}
        <FormControl>
          <InputLabel id="categories-checkbox-label">Categories</InputLabel>
          <Select
            labelId="categories-checkbox-label"
            id="categories-checkbox"
            multiple
            value={categories}
            onChange={(event) => {
              const {
                target: { value },
              } = event;
              typeof value !== 'string' && setCategories(() => value);
            }}
            input={<OutlinedInput label="Categories" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
                // sx={{ ...menuItemProps(category) }}
              >
                <Checkbox
                  checked={
                    categories.findIndex((cat) => cat.id === category.id) > -1
                  }
                />
                <ListItemText primary={category.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Google Places Autocomplete */}
        <Autocomplete
          fullWidth
          freeSolo
          autoSelect
          blurOnSelect
          value={location}
          onChange={async (event, newValue) => {
            setLocation(() => newValue);
            if (
              typeof newValue === 'string' ||
              newValue === null ||
              newValue.place_id === undefined
            ) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = setTimeout(() => {
                setSettings((prev) => {
                  let updatedSettings = { ...prev };
                  if (newValue === null) {
                    updatedSettings.location = newValue;
                  } else if (typeof newValue === 'string') {
                    updatedSettings.location = {
                      name: newValue,
                    };
                  }
                  return updatedSettings;
                });
              }, 500);
              return;
            }
            var request: google.maps.places.PlaceDetailsRequest = {
              sessionToken: sessionToken,
              placeId: newValue.place_id,
              fields: [
                'name',
                'place_id',
                'address_component',
                'formatted_address',
              ],
            };
            function callback(
              place: google.maps.places.PlaceResult | null,
              status: google.maps.places.PlacesServiceStatus
            ) {
              if (status == window.google.maps.places.PlacesServiceStatus.OK) {
                if (!place || !place.place_id) return;

                const details: Location = {
                  name: place.name,
                  place_id: place.place_id,
                  formatted_address: place.formatted_address,
                };

                place?.address_components?.forEach((component) => {
                  const componentType = component.types[0];

                  switch (componentType) {
                    case 'street_number':
                      details.street_number = component.long_name;
                      break;
                    case 'route':
                      details.route = component.long_name;
                      break;
                    case 'locality':
                      details.locality = component.long_name;
                      break;
                    case 'administrative_area_level_2':
                      details.administrative_area_level_2 = component.long_name;
                      break;
                    case 'administrative_area_level_1':
                      details.administrative_area_level_1 = component.long_name;
                      break;
                    case 'country':
                      details.country = component.long_name;
                      break;
                    case 'postal_code':
                      details.postal_code = component.long_name;
                      break;
                    default:
                      break;
                  }
                });

                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                  setSettings((prev) => {
                    let updatedSettings = { ...prev };
                    updatedSettings.location = details;
                    return updatedSettings;
                  });
                }, 500);
              }
            }
            window.placesService.getDetails(request, callback);
            setSessionToken(undefined);
          }}
          inputValue={locationInput}
          onInputChange={(event, newInputValue) => {
            window.setLocationSuggestions = setLocationSuggestions;
            setLocation(() => null);
            setLocationInput(() => newInputValue);
            if (newInputValue === '') return;
            window.autocompleteService.getPlacePredictions(
              { input: newInputValue, sessionToken: sessionToken },
              window.displaySuggestions
            );
          }}
          id="bracketLocation"
          options={locationSuggestions}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Location"
              fullWidth
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <GoogleIcon />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          // renderOption={(props, option) => (
          //   <Box component="li" {...props}>
          //     option?.description
          //   </Box>
          // )}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            else return option.description || '';
          }}
          isOptionEqualToValue={(option, value) =>
            option.description === value.description
          }
        />

        {/* <TextField
          inputRef={locationRef}
          type="text"
          fullWidth={true}
          label="Location"
          value={location}
          onChange={(e) => {
            setLocation(() => e.target.value);
            // clearTimeout(timeoutRef.current);
            // setImage(() => e.target.value);
            // timeoutRef.current = setTimeout(() => {
            //   setSettings((prev) => {
            //     let updatedSettings = { ...prev };
            //     updatedSettings.image = e.target.value;
            //     return updatedSettings;
            //   });
            // }, 500);
          }}
        /> */}

        {/* Unpublish */}
        {'id' in settings && (
          <Button
            variant="contained"
            color="error"
            startIcon={
              published ? <PublishedWithChangesIcon /> : <UnpublishedIcon />
            }
            endIcon={<Switch checked={published} color="default" />}
            sx={{
              justifyContent: 'space-between',
              '.MuiSwitch-switchBase:hover': {
                backgroundColor: 'transparent',
              },
            }}
            onClick={(e) => {
              const publishedValue = !published; // new published value
              setPublished(() => publishedValue);
              setSettings((prev) => {
                let updatedSettings = { ...prev };
                updatedSettings.published = publishedValue;
                return updatedSettings;
              });
            }}
          >
            {published ? 'Published' : 'Unpublished'}
          </Button>
        )}

        {/* Delete bracket */}
        {'id' in settings && (
          <Button
            variant="contained"
            color="warning"
            // startIcon={DeleteIcon}
            // endIcon={<Switch checked={published} color="default" />}
            // sx={{
            //   justifyContent: 'space-between',
            //   '.MuiSwitch-switchBase:hover': {
            //     backgroundColor: 'transparent',
            //   },
            // }}
            onClick={handleOpenDeleteBracketModal}
          >
            Delete Bracket
          </Button>
        )}
      </Stack>
      {'id' in settings && (
        <DeleteBracketModal
          open={openDeleteBracketModal}
          handleClose={handleCloseDeleteBracketModal}
          settings={settings}
        />
      )}
    </>
  );
}
