"use strict";
var Q = require('q');
var pg = require('pg');
var _ = require('underscore');
var utils = require('../utils');
var config = require('../config');

function UserService() {
  this.createUserFromResult = function (data) {
    return {
      id: data.id,
      name: data.name,
      alias: data.alias,
      email: data.email,
      sex: data.sex,
      age: data.age,
      photo_profile: 'base_64',
      interests: data.interests,
      location: {
        latitude: data.latitude,
        longitude: data.longitude
      },
      file: data.photo_profile
    };
  };
  this.populateUserInterests = function (data) {
    var deferred = Q.defer();
    pg.connect(config.DATABASE_URL, function (err, client, done) {
      data.interests = "";
      client.query("SELECT * FROM userInterests WHERE userId = ($1)", [data.id], function (err, result) {
        if (result.rowCount > 0) {
          var count = result.rowCount;
          _.each(result.rows, function (user) {
            client.query("SELECT * FROM interests WHERE id = ($1)", [user.interestid], function (err, result) {
              data.interests += result.rows[0].category + '-' + result.rows[0].value + ' , ';
              count--;
              if (count == 0) {
                done();
                data.interests = data.interests.substr(0, data.interests.length - 2);
                deferred.resolve(data);
              }
            });
          });
        } else {
          deferred.resolve(data);
        }
      });
    });
    return deferred.promise;
  };
}

UserService.prototype.byAlias = function (alias) {
  var deferred = Q.defer();
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("SELECT * FROM users WHERE alias = ($1)", [alias], function (err, result) {
      done();
      if (err) {
        console.log(err);
        deferred.reject();
      } else {
        deferred.resolve(result.rows[0]);
      }
    });
  });
  return deferred.promise;
};

UserService.prototype.get = function (userId, next) {
  var that = this;
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    var query = client.query("SELECT * FROM users WHERE id = ($1)", [userId]);
    // Stream results back one row at a time
    query.on('row', function (row, result) {
      result.addRow(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', function (result) {
      if (result.rowCount) {
        that.populateUserInterests(result.rows[0]).then(function (data) {
          next(null, data);
        });
      }
    });
  });
};

UserService.prototype.create = function (data, next) {
  var that = this;
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    var encryptedPassword = utils.encryptPassword(data.password);
    var photo_profile_base64 = data.photo_profile ? data.photo_profile.replace(/ /g, '+') : null;
    client.query("SELECT * FROM users WHERE alias = ($1)", [data.username], function (err, result) {

      if (result.rowCount) {
        next({message: "Username already taken"}, null);
      }

      var user = [data.name || null, data.username || null, encryptedPassword, data.email || null, data.sex || null, data.age
      || null, data.latitude || null, data.longitude || null, photo_profile_base64];

      client.query("INSERT INTO users(name, alias, password, email, sex, age, latitude, longitude, photo_profile)" +
      " values($1, $2, $3, $4, $5, $6, $7, $8, $9)", user, function (err, result) {
        if (err) {
          console.log(err);
          next({message: ""}, null);
        } else if (!data.interests) {
          next(null, {});
        } else {
          that.byAlias(data.username).then(function (response) {
            if (!_.isArray(data.interests)) {
              data.interests = [data.interests];
            }
            var count = data.interests.length;
            _.each(data.interests, function (interest) {
              client.query("SELECT * FROM interests WHERE value = ($1)", [interest.split('-')[1]], function (err, result) {
                if (result.rowCount) {
                  client.query("INSERT INTO userInterests(userId, interestId) values($1, $2)", [response.id, result.rows[0].id], function (err, result) {
                    count--;
                    if (count == 0) {
                      done();
                      next(null, {});
                    }
                  });
                }
              });
            });
          });
        }
      });
    });
  });
};

UserService.prototype.getAll = function (next) {
  var that = this;
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    var query = client.query("SELECT * FROM users ORDER BY id ASC;");
    // Stream results back one row at a time
    query.on('row', function (row, result) {
      result.addRow(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', function (result) {
      var jsonObject = {"users": [], metadata: {version: 0.1, count: result.rowCount}};
      var count = result.rowCount;
      _.each(result.rows, function (user) {
        that.populateUserInterests(user).then(function (data) {
          jsonObject.users.push(that.createUserFromResult(data));
          count--;
          if (count == 0) {
            next(null, jsonObject);
          }
        });
      });
    });
  });
};

UserService.prototype.getCandidate = function (alias, next) {
  var that = this;
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    var query = client.query("SELECT * FROM userinterests iu, users u" +
    " WHERE u.alias= ($1)" +
    " and iu.userid <> u.id" +
    " and iu.interestid " +
    " IN (SELECT iu2.interestid FROM userinterests iu2 WHERE iu2.userid = u.id)", [alias], function (err, result) {

      // Stream results back one row at a time
      query.on('row', function (row, result) {
        result.addRow(row);
      });

      // After all data is returned, close connection and return results
      query.on('end', function (result) {
        var jsonObject = {"users": [], metadata: {version: 0.1}};
        _.each(result.rows, function (user) {
          if (result.rowCount) {
            jsonObject.users.push(that.createUserFromResult(user));
          }
        });
        jsonObject.metadata.count = jsonObject.users.length;
        done();
        next(null, jsonObject);
      });
    });
  });
};

UserService.prototype.update = function (userId, data, next) {
  var updateQuery = [];
  var keys = _.keys(data);
  data.photo_profile = keys["photo_profile"] ? data.photo_profile.replace(/ /g, '+') : null;

  if (keys["interests"]) {
    keys = _.without(keys, "interests");
  }

  for (var i = 0; i < keys.length; i++) {
    updateQuery[i] = " " + keys[i] + " = '" + data[keys[i]] + "'";
  }
  updateQuery = updateQuery.join();

  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("UPDATE users SET" + updateQuery + " WHERE id = ($1)", [userId], function (err, result) {
      if (err) {
        next(err);
        console.log('ERROR');
      } else {
        // TODO Update interests
        next(null, {});
      }
    });
  });
};

UserService.prototype.delete = function (userId, next) {
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("DELETE FROM users WHERE id = ($1)", [userId], function (err, result) {
      if (err) {
        console.log(err);
        next(err);
      } else {
        client.query("DELETE FROM userInterests WHERE userId = ($1)", [userId], function (err, result) {
          done();
          if (err) {
            console.log(err);
            next(err);
          } else {
            next(null, {});
          }
        });
      }
    });
  });
};

exports = module.exports = function () {
  return new UserService();
};
