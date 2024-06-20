"use strict";
/** Database setup for jobly. */
const { Client , types} = require("pg");
const { getDatabaseUri } = require("./config");


types.setTypeParser(types.builtins.NUMERIC, parseFloat)

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    connectionString: getDatabaseUri()
  });
}

db.connect();

module.exports = db;