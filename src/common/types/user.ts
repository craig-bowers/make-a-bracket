import { ColorModeType } from '../contexts/mui/themes';

export type User = {
  id: string;
  name: string | null;
  email: string | null;
  email_verified: Date | null;
  image: string | null;
  display_name: string | null;
  color_mode: ColorModeType;
};
