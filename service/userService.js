"use strict";
var Q = require('q');
var pg = require('pg');
var _ = require('underscore');
var utils = require('../utils');
var config = require('../config');

function UserService() {

  this.createUserFromResult = function (data, withPhoto) {

    var user = {
      id: data.id,
      name: data.name,
      alias: data.alias,
      email: data.email,
      gender: data.gender,
      age: data.age,
      interests: data.interests,
      location: {
        latitude: data.latitude,
        longitude: data.longitude
      }
    };

    if (withPhoto) {
      user.photo_profile = encodeURI(data.photo_profile.toString());
    }

    return user;
  };

  this.populateUserInterests = function (user) {
    var deferred = Q.defer();

    pg.connect(config.DATABASE_URL, function (err, client, done) {
      user.interests = [];

      client.query("SELECT i.id, i.category, i.value FROM userInterests ui, interests i, users u " +
      " WHERE u.id = ($1)" +
      " AND ui.userId=u.id" +
      " AND i.id=ui.interestId", [user.id], function (err, result) {
        done();
        if (result.rowCount > 0) {
          _.each(result.rows, function (row) {
            user.interests.push({id: row.id, category: row.category, value: row.value})
          });
        }
        deferred.resolve(user);
      });
    });

    return deferred.promise;
  };

  this.insertUserInterest = function (userId, interestId) {
    var deferred = Q.defer();
    pg.connect(config.DATABASE_URL, function (err, client, done) {
      client.query("INSERT INTO userInterests(userId, interestId) values($1, $2)", [userId, interestId], function (err, result) {
        done();
        deferred.resolve();
      });
    });
    return deferred.promise;
  };

  this.deleteUserInterests = function (userId, interestId) {
    var deferred = Q.defer();
    pg.connect(config.DATABASE_URL, function (err, client, done) {
      client.query("DELETE FROM userInterests " +
      " WHERE userId = ($1)" +
      " AND interestId = ($2)", [userId, interestId], function (err, result) {
        done();
        deferred.resolve();
      });
    });
    return deferred.promise;
  }
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
      done();
      if (result.rowCount) {
        that.populateUserInterests(result.rows[0]).then(function (data) {
          data.photo_profile = data.photo_profile.toString();
          next(null, data);
        }).fail(function (err) {
          next(err, null);
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
        done();
        next({message: "Username already taken"}, null);
      }

      var user = [data.name, data.username, encryptedPassword, data.email, data.gender, data.age
        , data.latitude, data.longitude, photo_profile_base64];

      //Create user
      client.query("INSERT INTO users(name, alias, password, email, gender, age, latitude, longitude, photo_profile)" +
      " values($1, $2, $3, $4, $5, $6, $7, $8, $9)", user, function (err, result) {
        done();
        if (err) {
          console.log(err);
          next({message: ""}, null);
        } else if (!data.interests) {
          next(null, {});
        } else {
          that.byAlias(data.username).then(function (response) {
            var promises = [];
            //Create user associated interests
            _.each(data.interests, function (interest) {
              var promise = that.insertUserInterest(response.id, interest.id);
              promises.push(promise);
            });
            Q.all(promises).then(function () {
              next(null, {});
            }).fail(function (err) {
              next(err, null);
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
    var query = client.query("SELECT id,name,alias,email,gender,age,latitude,longitude FROM users ORDER BY id ASC;");
    // Stream results back one row at a time
    query.on('row', function (row, result) {
      result.addRow(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', function (result) {
      done();
      var jsonObject = {"users": [], metadata: {version: 0.1, count: result.rowCount}};
      var promises = [];
      _.each(result.rows, function (user) {
        var promise = that.populateUserInterests(user).then(function (data) {
          jsonObject.users.push(that.createUserFromResult(data, false));
        });
        promises.push(promise);
      });

      Q.all(promises).then(function () {
        next(null, jsonObject);
      }).fail(function (err) {
        next(err, null);
      });
      ;
    });
  });
};

UserService.prototype.getCandidate = function (alias, next) {
  var that = this;
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    var query = client.query("SELECT DISTINCT * FROM userinterests iu, users u" +
    " WHERE u.alias <> ($1)" +
    " and iu.userid = u.id" +
    " and iu.interestid " +
    " IN (SELECT iu2.interestid FROM userinterests iu2 WHERE iu2.userid = u.id)", [alias], function (err, result) {

      // Stream results back one row at a time
      query.on('row', function (row, result) {
        result.addRow(row);
      });

      // After all data is returned, close connection and return results
      query.on('end', function (result) {
        done();
        var jsonObject = {"users": [], metadata: {version: 0.1}};
        var promises = [];
        _.each(result.rows, function (user) {
          //todo acá falta filtrar por la localización
          var promise = that.populateUserInterests(user).then(function (data) {
            jsonObject.users.push(that.createUserFromResult(data, true));
          });
          promises.push(promise);
        });

        Q.all(promises).then(function () {
          jsonObject.metadata.count = jsonObject.users.length;
          next(null, jsonObject);
        }).fail(function (err) {
          next(err, null);
        });
        ;
      });
    });
  });
};

UserService.prototype.update = function (userId, data, next) {
  var updateQuery = [];

  var selectedInterests = data.interests;
  delete(data.interests);

  var keys = Object.keys(data);

  data.photo_profile = data["photo_profile"] ? data.photo_profile.replace(/ /g, '+') : null;

  for (var i = 0; i < keys.length; i++) {
    updateQuery[i] = " " + keys[i] + " = '" + data[keys[i]] + "'";
  }

  updateQuery = updateQuery.join();

  var that = this;

  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("UPDATE users SET" + updateQuery + " WHERE id = ($1)", [userId], function (err, result) {
      done();
      if (err) {
        next(err);
        console.log(err);
      } else {
        client.query("SELECT i.id FROM userInterests ui, interests i" +
        " WHERE  userId= ($1)" +
        " AND i.id=ui.interestId", [userId], function (err, result) {

          result.rows = _.map(result.rows, function (row) {
            return row.id;
          });

          var interestsToInsert = _.difference(selectedInterests, result.rows);//2;1,2->[]
          var interestsToDelete = _.difference(result.rows, selectedInterests);//1,2;1->2

          var promises = [];

          _.each(interestsToInsert, function (interest) {
            promises.push(that.insertUserInterest(userId, interest));
          });

          _.each(interestsToDelete, function (interest) {
            promises.push(that.deleteUserInterests(userId, interest));
          });

          Q.all(promises).then(function () {
            next(null, {});
          }).fail(function (err) {
            next(err, null);
          });
        });
      }
    });
  });
};

UserService.prototype.delete = function (userId, next) {
  //fixme do this in a transaction https://github.com/brianc/node-postgres/wiki/Transactions
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("DELETE FROM userInterests WHERE userId = ($1)", [userId], function (err, result) {
      if (err) {
        console.log(err);
        next(err);
      } else {
        client.query("DELETE FROM users WHERE id = ($1)", [userId], function (err, result) {
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
