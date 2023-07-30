export type Overwrite<T, U> = { [P in Exclude<keyof T, keyof U>]: T[P] } & U;
export type WithOptionalProp<Type, Key extends keyof Type> = Type &
  Partial<Pick<Type, Key>>;
export type WithRequiredProp<Type, Key extends keyof Type> = Type &
  Required<Pick<Type, Key>>;
