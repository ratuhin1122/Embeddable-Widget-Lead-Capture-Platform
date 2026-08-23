const config = require('../config');

const isSqlite = config.databaseUrl.startsWith('sqlite') || process.env.NODE_ENV === 'test';

const knexConfig = isSqlite
  ? {
      client: 'sqlite3',
      connection: config.databaseUrl.startsWith('sqlite')
        ? { filename: config.databaseUrl.replace(/^sqlite:\/\//, '') }
        : { filename: ':memory:' },
      useNullAsDefault: true,
      migrations: {
        directory: __dirname + '/migrations',
        tableName: 'knex_migrations',
      },
      pool: {
        afterCreate: (conn, cb) => {
          conn.run('PRAGMA foreign_keys = ON', cb);
        },
      },
    }
  : {
      client: 'pg',
      connection: config.databaseUrl,
      migrations: {
        directory: __dirname + '/migrations',
        tableName: 'knex_migrations',
      },
      pool: {
        min: 2,
        max: 10,
      },
    };

module.exports = knexConfig;
