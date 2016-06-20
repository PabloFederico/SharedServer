'use strict';
var pg = require('pg');
var _ = require('underscore');
var config = require('./config');
var utils = require('./utils');
var userService = require('./service/userService')();

exports = module.exports = function (app, passport) {
  var LocalStrategy = require('passport-local').Strategy;

  passport.use(new LocalStrategy(
    function (username, password, done) {
      pg.connect(config.DATABASE_URL, function (err, client, pgDone) {
        client.query("SELECT * FROM users" +
          " WHERE alias = ($1)", [username], function (err, result) {
          pgDone();
          
          if (err) {

            return done(err);
          }

          if (!result.rowCount) {
            return done(null, false, {message: 'Unknown user'});
          }

          var user = result.rows[0];
          if (user.password !== utils.encryptPassword(password)) {
            return done(null, false, {message: 'Invalid password'});
          }

          //Avoid return encoded password
          delete(user.password);
          
          //Return photo profile as base64 string instead bytea default
          user.photo_profile = encodeURI(user.photo_profile.toString());

          userService.populateUserInterests(user).then(function (data) {
            return done(null, user);
          });
        });
      });
    }
  ));

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    pg.connect(config.DATABASE_URL, function (err, client, pgDone) {
      client.query("SELECT * FROM users WHERE id = ($1)", [id], function (err, result) {
        pgDone();
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
