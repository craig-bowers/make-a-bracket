import CssBaseline from '@mui/material/CssBaseline'; // https://mui.com/components/css-baseline/
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Import providers
import { ThemeProviders } from './themes';
import { SnackbarContextProvider } from './snackbar';

// Export merged providers
export function MuiProviders(props: { children: React.ReactNode }) {
  return (
    <ThemeProviders>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SnackbarContextProvider>
          <CssBaseline />
          {props.children}
        </SnackbarContextProvider>
      </LocalizationProvider>
    </ThemeProviders>
  );
}

// Export useContexts
export { useColorModeContext } from './themes';
export { useSnackbarContext } from './snackbar';
