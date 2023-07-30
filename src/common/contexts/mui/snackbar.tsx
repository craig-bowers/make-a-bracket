import * as React from 'react';

// MUI imports
import {
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Link as MUILink,
  ListItem,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  SnackbarProps,
  Stack,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material';

// MUI Icons
import CloseIcon from '@mui/icons-material/Close';

// Types
type SnackbarContextType = {
  pushSnack: (snack: SnackbarProps) => void;
  pushSnacks: (snacks: SnackbarProps[], timeout?: number) => void;
  handleClose: (event?: React.SyntheticEvent, reason?: string) => void;
  handleExited: () => void;
};

const SnackbarContext = React.createContext<SnackbarContextType>({
  pushSnack: (snack) => {},
  pushSnacks: (snacks, timeout) => {},
  handleClose: (event, reason) => {},
  handleExited: () => {},
});

export function SnackbarContextProvider(props: {
  children: React.ReactNode;
}): JSX.Element {
  const [snackPack, setSnackPack] = React.useState<SnackbarProps[]>([]);
  const [open, setOpen] = React.useState(false);
  const [currentSnack, setCurrentSnack] = React.useState<
    SnackbarProps | undefined
  >(undefined);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (snackPack.length && !currentSnack) {
      // Set a new snack when we don't have an active one
      setCurrentSnack(snackPack[0]);
      setSnackPack((prev) => prev.slice(1));
      setOpen(true);
    } else if (snackPack.length && currentSnack && open) {
      // Close an active snack when a new one is added
      setOpen(false);
    }
  }, [snackPack, currentSnack, open]);

  const snackbar = React.useMemo<SnackbarContextType>(
    () => ({
      pushSnack: (snack) => {
        clearTimeout(timeoutRef.current);
        const defaultSnack = {
          // https://mui.com/api/snackbar/
          action: (
            <>
              {/* <Button
                color="secondary"
                size="small"
                onClick={snackbar.handleClose}
              >
                UNDO
              </Button> */}
              <IconButton
                aria-label="close"
                color="inherit"
                sx={{ p: 0.5 }}
                onClick={snackbar.handleClose}
              >
                <CloseIcon />
              </IconButton>
            </>
          ),
          // anchorOrigin: { vertical: 'bottom', horizontal: 'left' }, // default: { vertical: 'bottom', horizontal: 'left' }
          autoHideDuration: 6000,
          // children: __MUIDEFAULT,
          // classes: __MUIDEFAULT,
          // ClickAwayListenerProps: __MUIDEFAULT,
          // ContentProps: __MUIDEFAULT,
          // disableWindowBlurListener: __MUIDEFAULT,
          key: new Date().getTime(),
          message: currentSnack ? currentSnack.message : undefined,
          onClose: snackbar.handleClose,
          // open: open, DON'T UNCOMMENT, THIS IS SET VIA STATE DIRECTLY IN COMPONENT BELOW
          // resumeHideDuration: __MUIDEFAULT,
          // sx: __MUIDEFAULT,
          // TransitionComponent: __MUIDEFAULT,
          // transitionDuration: __MUIDEFAULT,
          TransitionProps: { onExited: snackbar.handleExited },
        };

        setSnackPack((prev) => [
          ...prev,
          Object.assign({}, defaultSnack, snack),
        ]);
      },

      pushSnacks: (snacks, timeout = 2000) => {
        if (snacks.length > 0) {
          snackbar.pushSnack(snacks[0]);
          timeoutRef.current = setTimeout(() => {
            snackbar.pushSnacks(snacks.slice(1), timeout);
          }, timeout);
        }
      },

      // clearTimeout: () => {
      //   clearTimeout(timeoutRef.current);
      // },

      handleClose: (event, reason) => {
        if (reason === 'clickaway') {
          return;
        }
        setOpen(false);
      },

      handleExited: () => {
        setCurrentSnack(undefined);
      },
    }),
    []
  );

  return (
    <SnackbarContext.Provider value={snackbar}>
      {props.children}
      <Snackbar open={open} {...currentSnack} />
    </SnackbarContext.Provider>
  );
}

export const useSnackbarContext = () => React.useContext(SnackbarContext);
