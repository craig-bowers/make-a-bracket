import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Fragment,
} from 'react';

// MUI Theme
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSnackbarContext } from '../../../../common/contexts/mui';

// MUI
import { Alert, Button, Stack, TextField } from '@mui/material';

// Material Icons
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// import type { Settings } from '../../../../common/types/bracket';
type EmbedProps = {
  bracket_id: number;
};

export default function EmbedComponent({ bracket_id }: EmbedProps) {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));
  const snackbar = useSnackbarContext();

  const embedCode =
    `<div id="bracket-embed-${bracket_id}"></div>` +
    '\n' +
    `<script src="${process.env.NEXT_PUBLIC_SITE_URL}/script/embed/bracket.js?id=${bracket_id}"></script>`;

  return (
    // <>
    <Stack spacing={2} py={1}>
      {/* Embed code */}
      <TextField
        id="embed-code-text-field"
        label="Embed code"
        fullWidth
        multiline
        minRows={4}
        maxRows={16}
        value={embedCode}
        onFocus={(event) => {
          event.target.select();
        }}
      />

      {/* Copy */}
      <Button
        variant="outlined"
        startIcon={<ContentCopyIcon />}
        onClick={() => {
          navigator.clipboard.writeText(embedCode);
          return snackbar.pushSnack({
            children: (
              <Alert
                variant="filled"
                onClose={snackbar.handleClose}
                severity="success"
                // sx={{ width: '100%' }}
              >
                Copied!
              </Alert>
            ),
          });
        }}
      >
        Copy
      </Button>
    </Stack>
    // </>
  );
}
