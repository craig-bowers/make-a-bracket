import { useState, useEffect, useRef, Fragment, useMemo } from 'react';
import { useRouter } from 'next/router';
// Session
import { useSession, signIn, signOut } from 'next-auth/react';

// New bracket modal
import Match from '../bracket/match';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSnackbarContext } from '../../common/contexts/mui';

// MUI Data Grid
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

// MUI
import {
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
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
  unstable_useId,
} from '@mui/material';

// Material Icons
import AddBoxSharpIcon from '@mui/icons-material/AddBoxSharp';
import FormatListNumberedSharpIcon from '@mui/icons-material/FormatListNumberedSharp';

// Types
import {
  Round,
  NewRound,
  Game,
  NewGame,
  Participant,
  NewParticipant,
  Settings,
  NewSettings,
  Votes,
  UserPick,
  NewUserPick,
} from '../../common/types/bracket';
type LeaderboardComponentProps = {
  bracket_id: number;
};
import type { LeaderboardData } from '../../pages/api/bracket/leaderboard/[id]';

export default function Leaderboard({ bracket_id }: LeaderboardComponentProps) {
  const router = useRouter();
  const snackbar = useSnackbarContext();
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));
  const { data: session, status } = useSession();

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>([]);

  useEffect(() => {
    if (!router.isReady) return;
    try {
      (async () => {
        let res = await fetch(`/api/bracket/leaderboard/${bracket_id}`);
        if (res.status !== 200) {
          return snackbar.pushSnack({
            children: (
              <Alert
                variant="filled"
                onClose={snackbar.handleClose}
                severity="error"
                // sx={{ width: '100%' }}
              >
                Couldn&apos;t get leaderboard.
              </Alert>
            ),
          });
        } else {
          let leaderboard: LeaderboardData = await res.json();
          if ('message' in leaderboard) {
            return snackbar.pushSnack({
              children: (
                <Alert
                  variant="filled"
                  onClose={snackbar.handleClose}
                  severity="error"
                  // sx={{ width: '100%' }}
                >
                  Couldn&apos;t get leaderboard.
                </Alert>
              ),
            });
          }
          setLeaderboardData(() => leaderboard);
        }
      })();
    } catch (err) {
      console.error(err);
    }
  }, [bracket_id, router.isReady, snackbar]);

  const roundColumn = (leaderboardData: LeaderboardData): GridColDef[] | [] => {
    const columns: GridColDef[] = [];
    if (!('message' in leaderboardData) && leaderboardData.length !== 0) {
      leaderboardData[0].rounds.forEach((round, index) => {
        columns.push({
          field: `round${index + 1}`,
          headerName: `Round ${index + 1}`,
          type: 'number',
          width: 110,
        });
      });
    }
    return columns;
  };

  const userRows = (leaderboardData: LeaderboardData) => {
    if (!('message' in leaderboardData) && leaderboardData.length !== 0) {
      return leaderboardData.map((user) => {
        const roundScores: {
          [key: string]: number;
        } = {};
        user.rounds.forEach((round, index) => {
          roundScores[`round${index + 1}`] = round;
        });
        return {
          id: user.id,
          name: user.name,
          displayName: user.display_name,
          ...roundScores,
          total: user.total,
        };
      });
    }
    return [];
  };

  const columns = useMemo(() => {
    return [
      {
        field: 'name',
        headerName: 'Name',
        width: 150,
      },
      { field: 'displayName', headerName: 'Display_name', width: 150 },
      ...roundColumn(leaderboardData),
      {
        field: 'total',
        headerName: 'Total',
        type: 'number',
        width: 110,
      },
    ];
  }, [leaderboardData]);

  // function columns(): GridColDef[] {
  //   return [
  //     {
  //       field: 'name',
  //       headerName: 'Name',
  //       width: 150,
  //     },
  //     { field: 'displayName', headerName: 'Display_name', width: 150 },
  //     ...roundColumn(leaderboardData),
  //     {
  //       field: 'total',
  //       headerName: 'Total',
  //       type: 'number',
  //       width: 110,
  //     },
  //   ];
  // }

  // const columns: GridColDef[] = [
  //   {
  //     field: 'name',
  //     headerName: 'Name',
  //     width: 150,
  //   },
  //   { field: 'displayName', headerName: 'Display_name', width: 150 },
  //   ...roundColumn(leaderboardData),
  //   {
  //     field: 'total',
  //     headerName: 'Total',
  //     type: 'number',
  //     width: 110,
  //   },
  // ];

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <DataGrid
        rows={userRows(leaderboardData)}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5]}
        // disableRowSelectionOnClick
      />
    </Box>
  );
}
