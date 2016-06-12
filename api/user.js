"use strict";
var pg = require('pg');
var _ = require('underscore');
var config = require('../config');
var utils = require('../utils');

function createUserFromResult(result, index) {

  if (!index) {
    index = 0;
  }

  return {
    user: {
      id: result.rows[index].id,
      name: result.rows[index].name,
      alias: result.rows[index].alias,
      email: result.rows[index].email,
      sex: result.rows[index].sex,
      age: result.rows[index].age,
      photo_profile: 'base_64',
      interests: result.rows[index].interests,
      location: {
        latitude: result.rows[index].latitude,
        longitude: result.rows[index].longitude
      },
      file: result.rows[index].file
    },
    metadata: {
      version: 1.0
    }
  };
}

exports.login = function (request, response) {
  if (!request.user) {
    return response.json({success: false, error: "Invalid Login"});
  }
  return response.json(request.user);
};

exports.create = function (request, response) {
  pg.connect(config.DATABASE_URL, function (err, client, done) {

    var encryptedPassword = utils.encryptPassword(request.body.password);
    var data = {
      name: request.body.name,
      alias: request.body.username,
      password: encryptedPassword,
      email: request.body.email,
      interests: request.body.interests,
      sex: request.body.sex,
      age: request.body.age,
      latitude: request.body.latitude,
      longitude: request.body.longitude,
      file: request.body.file
    };

    client.query("SELECT * FROM users WHERE alias = ($1)", [data.alias], function (err, result) {
      if (result.rowCount) {
        console.log('username already taken');
        return response.status(400).json({error: "username already taken"});
      } else {
        client.query("INSERT INTO users(name, alias, password, email, interests, sex, age, latitude, longitude, image)" +
          " values($1, $2, $3, $4, $5, $6, $7, $8, $9,$10)",
          [data.name, data.alias, data.password, data.email, data.interests, data.sex, data.age, data.latitude, data.longitude, data.file]
          , function (err) {
            done();
            if (err) {
              console.log(err);
            }
            // After all data is returned, close connection and return results
            return response.status(200).json({message: "Successful signup"});
          });
      }
    });
  });
};

exports.update = function (request, response) {
  var updateQuery = [];
  var keys = _.keys(request.body);

  for (var i = 0; i < keys.length; i++) {
    updateQuery[i] = " " + keys[i] + " = '" + request.body[keys[i]] + "'";
  }
  updateQuery = updateQuery.join();

  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("UPDATE users SET" + updateQuery + " WHERE id = ($1) RETURNING 1", [request.params.id], function (result) {
      done();
      response.sendStatus(200);
    });
  });
};

exports.delete = function (request, response) {
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("DELETE FROM users WHERE id = ($1)", [request.params.id], function (err) {
      done();
      if (err) {
        console.log(err);
        response.sendStatus(500);
      } else {
        response.sendStatus(200);
      }
    });
  });
};

exports.get = function (request, response) {
  var id = request.params.id;
  pg.connect(config.DATABASE_URL, function (err, client, done) {

    var query = client.query("SELECT * FROM users WHERE id = ($1)", [id]);

    // Stream results back one row at a time
    query.on('row', function (row, result) {
      result.addRow(row);
    });

    // After all data is returned, close connection and return results
    query.on('end', function (result) {
      done();
      if (result.rowCount) {
        return response.json(createUserFromResult(result));
      } else {
        response.sendStatus(500);
      }
    });
  });
};

exports.getAll = function (request, response) {
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    var query = client.query("SELECT * FROM users ORDER BY id ASC;");

    // Stream results back one row at a time
    query.on('row', function (row, result) {
      result.addRow(row);
    });

    // After all data is returned, close connection and return results
    query.on('end', function (result) {
      done();
      var jsonObject = {"users": [], metadata: {version: 0.1, count: result.rowCount}};
      for (var i = 0; i < result.rowCount; i++) {
        var anUser = createUserFromResult(result, i).user;
        jsonObject.users.push(anUser);
      }
      return response.json(jsonObject);
    });
  });
};

exports.getCandidate = function (request, response) {
  var interests = [];
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("SELECT * FROM users WHERE alias = ($1)", [request.params.user], function (err, result) {
      if (result.rowCount) {
        if (result.rows[0].interests) {
          interests = result.rows[0].interests.replace(/[{}\"]+/g, "").split(',');
          var query = client.query("SELECT * FROM users WHERE alias != ($1)", [request.params.user]);
          // Stream results back one row at a time
          query.on('row', function (row, result) {
            result.addRow(row);
          });
          // After all data is returned, close connection and return results
          query.on('end', function (result) {
            done();
            var jsonObject = {"users": [], metadata: {version: 0.1}};
            for (var i = 0; i < result.rowCount; i++) {
              if (result.rows[i].interests) {
                var userInterests = result.rows[i].interests.replace(/[{}\"]+/g, "").split(',');
                for (var j = 0; j < userInterests.length; j++) {
                  if (_.indexOf(interests, userInterests[j]) != -1) {
                    jsonObject.users.push(result.rows[i]);
                    break;
                  }
                }
              }
            }
            jsonObject.metadata.count = jsonObject.users.length;
            return response.json(jsonObject);
          });
        } else {
          return response.status(400).json({error: "User does not have interests"});
        }
      } else {
        return response.status(400).json({error: "User not found in the database"});
      }
    });
  });
};

exports.form_newUser = function (request, response) {
  response.render('newUser.html');
};

exports.form_viewUser = function (request, response) {
  response.render('viewUsers.html');
};

exports.form_editUser = function (request, response) {
  response.render('editUser.html');
};

exports.form_newInterest = function (request, response) {
  response.render('newInterest.html');
};

exports.form_viewInterests = function (request, response) {
  response.render('viewInterests.html');
};
