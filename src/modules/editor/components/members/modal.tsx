import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useContext,
  useMemo,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

// Utils
import { useSession, signIn, signOut, getSession } from 'next-auth/react';

// MUI Contexts
import { useTheme } from '@mui/material/styles';
import { useSnackbarContext } from '../../../../common/contexts/mui';

// Mui Colors
import { grey } from '@mui/material/colors';

// MUI
import {
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  Link as MUILink,
  ListItem,
  Menu,
  MenuItem,
  Modal,
  Paper,
  Select,
  Snackbar,
  Stack,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material';

// MUI Icons
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PlaceIcon from '@mui/icons-material/Place';

// Types
import type { Member } from '../../../../common/types/bracket';
import type {
  MemberData,
  MemberInfo,
} from '../../../../pages/api/bracket/member';
import { InvitedMember } from '../../../../pages/api/bracket/members/invites/[id]';
// import type { MemberInfo } from '../../../../pages/api/bracket/members/users/[id]';
import type { SetMembers, SetInvitedMembers } from '.';

type MemberModalProps = {
  open: boolean;
  handleClose: () => void;
  bracket_id: number;
  member?: MemberInfo;
  sessionMember: Member;
  setMembers: SetMembers;
  deleteBool: boolean;
  setInvitedMembers: SetInvitedMembers;
};

// ################################################
// ################################################
// ################ FUNCTION START ################
// ################################################
// ################################################

export default function MemberModal({
  open,
  handleClose,
  bracket_id,
  member,
  sessionMember,
  setMembers,
  deleteBool,
  setInvitedMembers,
}: MemberModalProps) {
  const router = useRouter();
  const theme = useTheme();
  const snackbar = useSnackbarContext();

  const [inviteEmail, setInviteEmail] = useState<string>(member?.email ?? '');
  const [memberRole, setMemberRole] = useState<string>(
    member?.role ?? 'member'
  );

  useEffect(() => {
    setInviteEmail(() => member?.email ?? '');
    setMemberRole(() => member?.role ?? 'member');
  }, [member]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="member-modal"
      aria-describedby={member ? 'Edit member' : 'Invite member'}
      sx={{
        // Used to center modal content with scrollable overflow
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        '.MuiModal-root:focus-visible': { outline: 'none' },
      }}
    >
      {/* Container and Paper start */}
      <Container maxWidth="sm" sx={{ maxHeight: '90%' }}>
        <Paper
          sx={{
            height: '100%', // Used for overflow
            padding: 0,
          }}
        >
          <Stack
            sx={{
              height: '100%', // Used for overflow
            }}
          >
            <Stack direction="row">
              {/* Close button */}
              <IconButton sx={{ alignSelf: 'center' }} onClick={handleClose}>
                <CloseIcon />
              </IconButton>
              {/* "Edit Profile" text */}
              <Typography
                id="member-modal"
                sx={{
                  flexGrow: 1,
                  alignSelf: 'center',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {deleteBool
                  ? 'Delete member'
                  : member
                  ? 'Edit member'
                  : 'Add member'}
              </Typography>
            </Stack>
            <Divider />
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              {deleteBool ? (
                <Stack
                  component="form"
                  spacing={2}
                  sx={{
                    height: '100%', // Used for overflow
                  }}
                  onSubmit={async (e) => {
                    if (!member?.user_id) return;
                    e.preventDefault();
                    let res = await fetch(
                      `/api/bracket/member?bracket_id=${bracket_id}&user_id=${member.user_id}`,
                      {
                        method: 'DELETE',
                        headers: {
                          'Content-type': 'application/json',
                        },
                      }
                    );
                    if (res.status === 200) {
                      setMembers((prev) => {
                        return prev.filter(
                          (mem) => mem.user_id !== member.user_id
                        );
                      });
                      snackbar.pushSnack({
                        children: (
                          <Alert
                            variant="filled"
                            onClose={snackbar.handleClose}
                            severity="success"
                            // sx={{ width: '100%' }}
                          >
                            Member removed.
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
                            Could not remove member.
                          </Alert>
                        ),
                      });
                    }
                    handleClose();
                  }}
                >
                  {/* Member Email */}
                  <TextField
                    type="email"
                    disabled
                    fullWidth={true}
                    label="Email"
                    variant="standard"
                    value={inviteEmail}
                  />

                  <Stack direction="row" spacing={2}>
                    <Button fullWidth={true} variant="contained" type="submit">
                      Confirm Delete
                    </Button>
                    <Button
                      fullWidth={true}
                      variant="outlined"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack
                  component="form"
                  spacing={2}
                  sx={{
                    height: '100%', // Used for overflow
                  }}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!member) {
                      // Add member
                      let res = await fetch(
                        `/api/bracket/member?bracket_id=${bracket_id}&email=${inviteEmail}&role=${memberRole}`,
                        {
                          method: 'POST',
                          headers: {
                            'Content-type': 'application/json',
                          },
                        }
                      );
                      let newMember: MemberData = await res.json();
                      console.log('newMember', newMember);
                      if (res.status === 200 && !('message' in newMember)) {
                        if ('expire_timestamp' in newMember) {
                          // No user existed, but sent an email
                          // Added row to bracket_member_invite
                          setInvitedMembers((prev) => {
                            return [newMember, ...prev] as InvitedMember[];
                          });
                          snackbar.pushSnack({
                            children: (
                              <Alert
                                variant="filled"
                                onClose={snackbar.handleClose}
                                severity="success"
                                // sx={{ width: '100%' }}
                              >
                                Invite sent.
                              </Alert>
                            ),
                          });
                          handleClose();
                        } else if (
                          res.status === 200 &&
                          'member_id' in newMember
                        ) {
                          setMembers((prev) => {
                            return [newMember, ...prev] as MemberInfo[];
                          });
                          snackbar.pushSnack({
                            children: (
                              <Alert
                                variant="filled"
                                onClose={snackbar.handleClose}
                                severity="success"
                                // sx={{ width: '100%' }}
                              >
                                Member added.
                              </Alert>
                            ),
                          });
                          handleClose();
                        }
                      } else if ('message' in newMember) {
                        snackbar.pushSnack({
                          children: (
                            <Alert
                              variant="filled"
                              onClose={snackbar.handleClose}
                              severity="error"
                              // sx={{ width: '100%' }}
                            >
                              {newMember.message}
                            </Alert>
                          ),
                        });
                      }
                    } else {
                      {
                        // Edit member (only edit role for now)
                        let res = await fetch(
                          `/api/bracket/member?bracket_id=${bracket_id}&user_id=${member.user_id}&role=${memberRole}`,
                          {
                            method: 'PUT',
                            headers: {
                              'Content-type': 'application/json',
                            },
                          }
                        );
                        let newMember: MemberData = await res.json();
                        if (res.status === 200 && !('message' in newMember)) {
                          setMembers((prev) => {
                            let updatedMembers = [...prev] as MemberInfo[];
                            let index = updatedMembers.findIndex(
                              (mem) => mem.user_id === member.user_id
                            );
                            return [
                              ...updatedMembers.slice(0, index),
                              newMember as MemberInfo,
                              ...updatedMembers.slice(index + 1),
                            ];
                          });
                          snackbar.pushSnack({
                            children: (
                              <Alert
                                variant="filled"
                                onClose={snackbar.handleClose}
                                severity="success"
                                // sx={{ width: '100%' }}
                              >
                                Member edited.
                              </Alert>
                            ),
                          });
                          handleClose();
                        } else {
                          snackbar.pushSnack({
                            children: (
                              <Alert
                                variant="filled"
                                onClose={snackbar.handleClose}
                                severity="error"
                                // sx={{ width: '100%' }}
                              >
                                Could not edit member.
                              </Alert>
                            ),
                          });
                        }
                      }
                    }
                  }}
                >
                  {/* Member Email */}
                  <TextField
                    type="email"
                    disabled={member ? true : false}
                    required={true}
                    autoFocus={true}
                    fullWidth={true}
                    label="Email"
                    variant="standard"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                    }}
                  />
                  {/* Member Role */}
                  <FormControl>
                    <InputLabel id={`member-role-select-label`}>
                      Role
                    </InputLabel>
                    <Select
                      labelId={`member-role-select-label`}
                      id={`member-role-select`}
                      value={memberRole}
                      disabled={
                        sessionMember.role !== 'owner' && memberRole === 'owner'
                      }
                      label="Role"
                      onChange={(e) => {
                        setMemberRole(() => e.target.value);
                      }}
                    >
                      <MenuItem value="member">Member</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      {
                        <MenuItem
                          value="owner"
                          disabled={sessionMember.role !== 'owner'}
                        >
                          Owner
                        </MenuItem>
                      }
                    </Select>
                  </FormControl>
                  <Button fullWidth={true} variant="outlined" type="submit">
                    {member ? 'Save' : 'Add'}
                  </Button>
                </Stack>
              )}
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Modal>
  );
}
