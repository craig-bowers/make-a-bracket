import type { JSONContent } from '@tiptap/react';

export type BracketTypes =
  | 'single-elimination'
  | 'single-elimination-rounds'
  | 'single-elimination-voting';

export type NewBracket = {
  settings: NewSettings;
  participants: NewParticipant[];
  rounds: NewRound[];
  categories: Category[];
};
export type Bracket = {
  settings: Settings;
  participants: Participant[];
  rounds: Round[];
  member: Member | null;
  categories: Category[];
  picks?: (UserPick | NewUserPick)[][];
  votes?: Votes;
};

export type BracketListing = Settings & Pick<Member, 'role'>;

export type NewSettings = {
  published: boolean;
  publish_timestamp: Date | string | null;
  bracket_type: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  rules: string;
  location: Location | null;
  visibility: boolean;
  restricted: boolean;
};
export type Settings = NewSettings & {
  id: number;
  ip?: string;
  create_timestamp: Date | string;
  create_user_id: string;
  modify_timestamp: Date | string | null;
  modify_user_id: string | null;
};

export type NewStyles = {
  [style: string]: string;
};
export type Styles = NewStyles & {};

export type NewParticipant = {
  key: string;
  name: string;
  ranking: number | null;
  image: string;
  email: string;
  website: string;
  video: string;
  details: string;
};
export type Participant = NewParticipant & {
  id: number;
  ip?: string;
  create_timestamp: Date | string;
  create_user_id: string;
  modify_timestamp: Date | string | null;
  modify_user_id: string | null;
  bracket_id: number;
};

export type NewRound = {
  games: NewGame[];
  key: string;
  number: number;
  name: string;
  timestamp_start: Date | string | null;
  timestamp_end: Date | string | null;
  ppg: number | null;
};

export type Round = Omit<NewRound, 'games'> & {
  games: Game[];
  id: number;
  ip?: string;
  create_timestamp: Date | string;
  create_user_id: string;
  modify_timestamp: Date | string | null;
  modify_user_id: string | null;
  bracket_id: number;
};

export type NewGame = {
  key: string;
  number: number;
  name: string;
  player_1: string;
  player_2: string;
  winner: string;
  player_1_score: number | null;
  player_2_score: number | null;
  time: Date | string | null;
  location: Location | null;
  details: JSONContent | null;
};
export type Game = NewGame & {
  id: number;
  ip?: string;
  create_timestamp: Date | string;
  create_user_id: string;
  modify_timestamp: Date | string | null;
  modify_user_id: string | null;
  bracket_id: number;
  round_id: number;
};

export type NewMember = {
  member_user_id: string;
  bracket_id: number;
  role: 'owner' | 'admin' | null;
};
export type Member = NewMember & {
  id: number;
  invite_ip?: string;
  invite_timestamp: Date | string;
  invite_user_id: string;
  member_ip?: string | null;
  member_timestamp: Date | string | null;
  accepted: boolean;
};

export type NewCategory = {
  parent_id: number | null;
  active: boolean;
  feature: number | null;
  name: string;
  slug: string;
  image: string;
  description: string;
};
export type Category = NewCategory & {
  id: number;
  create_timestamp: Date | string;
  create_user_id: string | null;
  create_ip?: string | null;
  modify_timestamp: Date | string | null;
  modify_user_id: string | null;
  modify_ip?: string | null;
  path: string;
};

export type BracketCategory = {
  id: number;
  timestamp: Date;
  bracket_id: number;
  category_id: number;
};

export type NewUserPick = {
  bracket_id: number;
  game_key: string;
  player_1: string;
  player_2: string;
  winner: string;
  player_1_score: number | null;
  player_2_score: number | null;
};
export type UserPick = NewUserPick & {
  id: number;
  ip?: string;
  timestamp: Date | string;
  user_id: string;
};

export type Votes = {
  user: UserVote[];
  games: GamesVotes;
};
export type UserVote = {
  id: number;
  ip?: string;
  timestamp: Date | string;
  user_id: string;
  bracket_id: number;
  game_key: string;
  participant_key: string;
};
export type GamesVotes = {
  [key: string]: {
    player_1_votes: number;
    player_2_votes: number;
  };
};

export type Location = Partial<{
  name: string;
  place_id: string;
  formatted_address: string;
  street_number: string;
  route: string;
  locality: string;
  administrative_area_level_2: string;
  administrative_area_level_1: string;
  country: string;
  postal_code: string;
}>;

export type LeaderboardUser = {
  id: number;
  name: string;
  display_name: string;
  rounds: number[];
  total: number;
};
