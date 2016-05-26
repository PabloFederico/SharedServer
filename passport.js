'use strict';
var pg = require('pg');
var _ = require('underscore');
var config = require('./config');
var utils = require('./utils');

exports = module.exports = function (app, passport) {
  var LocalStrategy = require('passport-local').Strategy;

  passport.use(new LocalStrategy(
    function (username, password, done) {
      pg.connect(config.DATABASE_URL, function (err, client) {
        client.query("SELECT * FROM users WHERE alias = ($1)", [username], function (err, result) {
          client.end();
          if (err) {
            return done(err);
          }

          if (!result.rowCount) {
            return done(null, false, {message: 'Unknown user'});
          }

          if (result.rows[0].password !== utils.encryptPassword(password)) {
            return done(null, false, {message: 'Invalid password'});
          }

          return done(null, result.rows[0]);
        });
      });
    }
  ));

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    pg.connect(config.DATABASE_URL, function (err, client) {
      client.query("SELECT * FROM users WHERE id = ($1)", [id], function (err, result) {
        client.end();
        if (err) {
          return done(err);
        }
        else {
          done(err, user);
        }
      });
    });
  });
};
