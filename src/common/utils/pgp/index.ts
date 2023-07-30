// ######################################
// Database connection
// ######################################

import pgPromise from 'pg-promise';
import type { IConnectionParameters } from 'pg-promise/typescript/pg-subset';

let ssl = undefined;
if (process.env.NODE_ENV === 'development') {
  ssl = { rejectUnauthorized: false };
} else if (process.env.NODE_ENV === 'production')
  ssl = { rejectUnauthorized: true, ca: process.env.CA_CERT };

const pgpConfig: IConnectionParameters = {
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  max: 30,
  ssl: ssl,
};
// pg-promise init options
const pgpInitOptions = {
  capSQL: true,
};

const pgp = pgPromise(pgpInitOptions);

// // NOW DECLARED IN getDB
// const db = pgp(pgpConfig);

type DatabaseScope = {
  db: pgPromise.IDatabase<any>;
  pgp: pgPromise.IMain;
};

// Without using a symbol/singleton we get duplicate connection pools https://github.com/vitaly-t/pg-promise/issues/175
// generic singleton creator:
function createSingleton<T>(name: string, create: () => T): T {
  const s = Symbol.for(name);
  let scope = (global as any)[s];
  if (!scope) {
    scope = { ...create() };
    (global as any)[s] = scope;
  }
  return scope;
}

// Common sql statements used in app
export { sql } from './sql';

export function getDB(): DatabaseScope {
  return createSingleton<DatabaseScope>('pgp-db-singleton', () => {
    return {
      db: pgp(pgpConfig),
      pgp: pgp,
    };
  });
}

// // ######################################
// // Exports (unused since we added the singleton)
// // ######################################

// export {
//   db, // database connection
//   // sql, // common sql statements
//   pgp, // can be used for ParameterizedQuery
// };
