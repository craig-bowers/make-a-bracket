import {
  useMemo,
  useState,
  useEffect,
  createContext,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { useRouter } from 'next/router';

import { ThemeProvider, createTheme, ThemeOptions } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'; // https://mui.com/components/css-baseline/
import { orange, blue, grey } from '@mui/material/colors';

import useMediaQuery from '@mui/material/useMediaQuery';

// Utils
import { useSession, signIn, signOut, getSession } from 'next-auth/react';

type ColorModeContextType = {
  setSystemPreference: () => void;
  setLight: () => void;
  setDark: () => void;
  getMode: () => ColorModeType;
};

export type ColorModeType = null | 'light' | 'dark';

const ColorModeContext = createContext<ColorModeContextType | undefined>(
  undefined
);

export function ThemeProviders(props: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // We use this below with systemPrefersDarkMode ? 'dark' : 'light'
  const systemPrefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  // Override of systemPrefersDarkMode
  const [mode, setMode] = useState<ColorModeType>('dark');

  const colorMode = useMemo<ColorModeContextType>(
    () => ({
      setSystemPreference: () => {
        setMode(() => null);
      },
      setLight: () => {
        setMode(() => 'light');
      },
      setDark: () => {
        setMode(() => 'dark');
      },
      getMode: () => {
        return mode;
      },
    }),
    [mode]
  );

  const currentUser = useRef<string | null | undefined>();
  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    const sessionUserId = session?.user?.id || null;
    if (currentUser.current !== sessionUserId) {
      if (session) {
        currentUser.current = session.user.id;
        // Set color mode
        session.user.color_mode === null && colorMode.setSystemPreference();
        session.user.color_mode === 'light' && colorMode.setLight();
        session.user.color_mode === 'dark' && colorMode.setDark();
      } else {
        colorMode.setSystemPreference();
        currentUser.current = null;
      }
    }
  }, [colorMode, session, status]);

  const getDesignTokens = useCallback(
    (mode: ColorModeType): ThemeOptions => ({
      // https://mui.com/customization/dark-mode/#dark-mode-with-custom-palette
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            html: {
              height: '100%',
            },
            body: {
              height: '100%',
              scrollbarColor:
                mode === 'dark'
                  ? `${grey[900]} inherit`
                  : `${orange[400]} inherit`,
              '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                backgroundColor: 'inherit',
                width: '.5em',
              },
              '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                borderRadius: 8,
                backgroundColor: mode === 'dark' ? grey[900] : orange[400],
                minHeight: 24,
                border: `3px solid inherit`,
              },
              '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus':
                {
                  backgroundColor: mode === 'dark' ? grey[800] : orange[500],
                },
              '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active':
                {
                  backgroundColor: mode === 'dark' ? grey[800] : orange[500],
                },
              '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover':
                {
                  backgroundColor: mode === 'dark' ? grey[800] : orange[500],
                },
              '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
                backgroundColor: 'inherit',
              },
            },
            '#__next': {
              height: '100%',
            },
            // main: {
            //   height: '100%',
            // },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 0,
            },
          },
        },
        MuiCard: {
          defaultProps: {
            square: true,
          },
        },
        MuiPaper: {
          defaultProps: {
            square: true,
          },
        },
        // MuiToolbar: {
        //   styleOverrides: {
        //     // dense: {
        //     //   height: 32,
        //     //   minHeight: 32,
        //     // },
        //     regular: {
        //       maxHeight: 64,
        //     },
        //   },
        // },
      },
      palette: {
        mode: mode !== null ? mode : systemPrefersDarkMode ? 'dark' : 'light',
        primary: {
          light: '#ff9800',
          main: '#ed6c02',
          dark: '#e65100',
          // ...orange,
          // ...(mode === 'dark' && {
          //   main: '#00FF00',
          //   // dark: '#000',
          //   // light: '#09fa33',
          //   // contrastText: '#fafafa',
          // }),
        },
        secondary: {
          light: '#42a5f5',
          main: '#1976d2',
          dark: '#1565c0',
          // ...blue,
        },
        warning: {
          light: '#ba68c8',
          main: '#9c27b0',
          dark: '#7b1fa2',
        },
        error: {
          light: '#ef5350',
          main: '#d32f2f',
          dark: '#c62828',
        },
        info: {
          light: '#03a9f4',
          main: '#0288d1',
          dark: '#01579b',
        },
        success: {
          light: '#4caf50',
          main: '#2e7d32',
          dark: '#1b5e20',
        },
        // ...(mode === 'dark' && {
        //   background: {
        //     default: deepOrange[900],
        //     paper: deepOrange[900],
        //   },
        // }),
        // text: {
        //   ...(mode === 'light'
        //     ? {
        //         primary: grey[800],
        //         secondary: grey[900],
        //       }
        //     : {
        //         primary: '#fff',
        //         secondary: grey[500],
        //       }),
        // },
      },
    }),
    [systemPrefersDarkMode]
  );

  const theme = useMemo(
    () => createTheme(getDesignTokens(mode)),
    [getDesignTokens, mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {props.children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export const useColorModeContext = () => useContext(ColorModeContext);
