"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdmin, ensureAuthUser } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login and admin
 **/

router.post("/",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.register(req.body);
      const token = createToken(user);
      return res.status(201).json({ user, token });
    } catch (err) {
      return next(err);
    }
  });

/* POST / :username/jobs/:id  user with username [username] applies for job with id of [id]

returns { applied : jobId}

Authorization required: login as admin or [username]

*/

router.post("/:username/jobs/:id",
  ensureLoggedIn,
  ensureAuthUser,
  async function (req, res, next) {
    try {
      const app = await User.apply(req.params.id, req.params.username);
      console.log(app)
      return res.json({ applied : app.jobId })
    } catch (err) {
      return next(err)
    }
  }
)


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login and admin
 **/

router.get("/",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    try {
      const users = await User.findAll();
      return res.json({ users });
    } catch (err) {
      return next(err);
    }
  });


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login as admin or [username]
 **/

router.get("/:username",
  ensureLoggedIn,
  ensureAuthUser,
  async function (req, res, next) {
    try {
      const user = await User.get(req.params.username);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  });


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login as admin or [username]
 **/

router.patch("/:username",
  ensureLoggedIn,
  ensureAuthUser,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  });


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login as admin or as [username]
 **/

router.delete("/:username",
  ensureLoggedIn,
  ensureAuthUser,
  async function (req, res, next) {
    try {
      await User.remove(req.params.username);
      return res.json({ deleted: req.params.username });
    } catch (err) {
      return next(err);
    }
  });


module.exports = router;
