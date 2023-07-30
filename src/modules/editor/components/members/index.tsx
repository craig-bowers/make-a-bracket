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
import MemberModal from './modal';

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
  Avatar,
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
  Unstable_Grid2 as Grid,
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

import type { Member } from '../../../../common/types/bracket';
import type {
  MemberInfo,
  MembersData,
} from '../../../../pages/api/bracket/members/users/[id]';
import type {
  InvitedMember,
  InvitedMembersData,
} from '../../../../pages/api/bracket/members/invites/[id]';
import { ReinviteData } from '../../../../pages/api/bracket/member/reinvite';
export type SetMembers = React.Dispatch<React.SetStateAction<MemberInfo[]>>;
export type SetInvitedMembers = React.Dispatch<
  React.SetStateAction<InvitedMember[]>
>;
type MembersComponentProps = { bracket_id: number; sessionMember: Member };
type InvitedMemberComponentProps = {
  member: InvitedMember;
  setInvitedMembers: SetInvitedMembers;
};

type MappedMemberProps = {
  member: MemberInfo;
  setSelectedMember: React.Dispatch<
    React.SetStateAction<MemberInfo | undefined>
  >;
  setDeleteBool: React.Dispatch<React.SetStateAction<boolean>>;
  handleOpenMemberModal: () => void;
};

function MappedMember({
  member,
  setSelectedMember,
  setDeleteBool,
  handleOpenMemberModal,
}: MappedMemberProps) {
  // Member menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(menuAnchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Paper>
      <Stack direction="row" spacing={2}>
        <Avatar
          alt={(member.name ?? member.display_name ?? member.email) + ' avatar'}
          src={member.image || ''}
        />

        <Grid container spacing={2}>
          <Grid md="auto">
            <Typography variant="h6">User Info</Typography>
            <Typography>{member.name}</Typography>
            <Typography>{member.display_name}</Typography>
            <Typography>{member.email}</Typography>
          </Grid>
          <Grid md="auto">
            <Typography variant="h6">Member Info</Typography>
            <Typography>
              Invite: {member.accepted ? 'Accepted' : 'Pending'}
            </Typography>
            <Typography sx={{ textTransform: 'capitalize' }}>
              Role: {member.role || 'member'}
            </Typography>{' '}
          </Grid>
          <Grid md="auto">
            <Button variant="outlined" onClick={handleMenuClick}>
              Edit
            </Button>
          </Grid>
          <Menu
            id="text-size-menu"
            anchorEl={menuAnchorEl}
            open={openMenu}
            onClose={handleCloseMenu}
            MenuListProps={{
              'aria-labelledby': 'text-size-button',
            }}
          >
            <MenuItem
              onClick={() => {
                setSelectedMember(() => member);
                setDeleteBool(() => false);
                handleOpenMemberModal();
                handleCloseMenu();
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                setSelectedMember(() => member);
                setDeleteBool(() => true);
                handleOpenMemberModal();
                handleCloseMenu();
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </Grid>
      </Stack>
    </Paper>
  );
}

function InvitedMemberComponent({
  member,
  setInvitedMembers,
}: InvitedMemberComponentProps) {
  const snackbar = useSnackbarContext();

  // Member menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(menuAnchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Paper>
      <Stack direction="row" spacing={2}>
        <Grid container spacing={2}>
          <Grid md="auto">
            <Typography variant="h6">Email</Typography>
            <Typography>{member.email}</Typography>
          </Grid>
          <Grid md="auto">
            <Button variant="outlined" onClick={handleMenuClick}>
              Edit
            </Button>
          </Grid>
          <Menu
            id="text-size-menu"
            anchorEl={menuAnchorEl}
            open={openMenu}
            onClose={handleCloseMenu}
            MenuListProps={{
              'aria-labelledby': 'text-size-button',
            }}
          >
            <MenuItem
              onClick={async (e) => {
                e.preventDefault();
                let res = await fetch(
                  `/api/bracket/member/reinvite?bracket_id=${member.bracket_id}&email=${member.email}&role=${member.role}`,
                  {
                    method: 'PUT',
                    headers: {
                      'Content-type': 'application/json',
                    },
                  }
                );
                let reinviteData: ReinviteData = await res.json();
                if (res.status === 200) {
                  setInvitedMembers((prev) => {
                    let updatedMembers = [...prev];
                    let index = updatedMembers.findIndex(
                      (m) => m.email === member.email
                    );
                    if (!('message' in reinviteData)) {
                      updatedMembers[index] = reinviteData;
                    }
                    return updatedMembers;
                  });
                  snackbar.pushSnack({
                    children: (
                      <Alert
                        variant="filled"
                        onClose={snackbar.handleClose}
                        severity="success"
                        // sx={{ width: '100%' }}
                      >
                        Resent invite.
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
                        Could not resend invite.
                      </Alert>
                    ),
                  });
                }
                handleCloseMenu();
              }}
            >
              Resend Invite
            </MenuItem>
            <MenuItem
              onClick={async (e) => {
                e.preventDefault();
                let res = await fetch(
                  `/api/bracket/member/delete?bracket_id=${member.bracket_id}&email=${member.email}`,
                  {
                    method: 'DELETE',
                    headers: {
                      'Content-type': 'application/json',
                    },
                  }
                );
                if (res.status === 200) {
                  setInvitedMembers((prev) => {
                    return prev.filter((m) => m.email !== member.email);
                  });
                  snackbar.pushSnack({
                    children: (
                      <Alert
                        variant="filled"
                        onClose={snackbar.handleClose}
                        severity="success"
                        // sx={{ width: '100%' }}
                      >
                        Invite rescinded.
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
                        Could not rescind invite.
                      </Alert>
                    ),
                  });
                }
                handleCloseMenu();
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </Grid>
      </Stack>
    </Paper>
  );
}

export default function MembersComponent({
  bracket_id,
  sessionMember,
}: MembersComponentProps) {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));
  const router = useRouter();
  const snackbar = useSnackbarContext();

  const timeoutRef = useRef<NodeJS.Timeout>();

  // Existing users
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [selectedMember, setSelectedMember] = useState<
    MemberInfo | undefined
  >();
  const [deleteBool, setDeleteBool] = useState(false);

  // Emailed invites
  const [invitedMembers, setInvitedMembers] = useState<InvitedMember[]>([]);

  // NewBracketModal state
  const [openMemberModal, setOpenMemberModal] = useState(false);
  const handleOpenMemberModal = () => setOpenMemberModal(true);
  const handleCloseMemberModal = () => setOpenMemberModal(false);

  useEffect(() => {
    (async () => {
      // Users on site + invited users
      const membersRes = await fetch(
        `/api/bracket/members/users/${bracket_id}`
      );
      const membersData: MembersData = await membersRes.json();
      if (!('message' in membersData)) {
        setMembers(membersData);
      }
      // Invited users without accounts
      const invitedRes = await fetch(
        `/api/bracket/members/invites/${bracket_id}`
      );
      const invitedData: InvitedMembersData = await invitedRes.json();
      let filteredInvites: InvitedMembersData = [];
      if (!('message' in invitedData) && !('message' in membersData)) {
        filteredInvites = invitedData.filter(
          (invitedMember) =>
            !membersData.some((member) => member.email === invitedMember.email)
        );
      }
      setInvitedMembers(filteredInvites);
    })();
  }, []);

  return (
    <>
      <Stack spacing={2} py={1}>
        {/* Invite Member */}
        <Button
          variant="contained"
          onClick={() => {
            setSelectedMember(() => undefined);
            setDeleteBool(() => false);
            handleOpenMemberModal();
          }}
        >
          Invite Member
        </Button>
        {members.map((member) => {
          return (
            <MappedMember
              key={member.member_id}
              member={member}
              setSelectedMember={setSelectedMember}
              setDeleteBool={setDeleteBool}
              handleOpenMemberModal={handleOpenMemberModal}
            />
          );
        })}
        {invitedMembers.map((member) => {
          return (
            <InvitedMemberComponent
              key={member.id}
              member={member}
              setInvitedMembers={setInvitedMembers}
            />
          );
        })}
      </Stack>
      <MemberModal
        open={openMemberModal}
        handleClose={handleCloseMemberModal}
        bracket_id={bracket_id}
        member={selectedMember}
        sessionMember={sessionMember}
        setMembers={setMembers}
        deleteBool={deleteBool}
        setInvitedMembers={setInvitedMembers}
      />
    </>
  );
}
