"use strict";
var pg = require('pg');
var _ = require('underscore');
var config = require('../config');
var client = new pg.Client(config.DATABASE_URL);

exports = module.exports = function () {
  client.connect();
}

function createUserFromResult(result) {
  return {
    user: {
      id: id,
      name: result.rows[0].name,
      alias: result.rows[0].alias,
      email: result.rows[0].email,
      location: {
        latitude: result.rows[0].latitude,
        longitude: result.rows[0].longitude
      }
    },
    metadata: {
      version: 1.0
    }
  };
}

exports.login = function (request, response) {
  console.log(request.body);
  response.sendStatus(200);
}

exports.create = function (request, response) {
  pg.connect(config.DATABASE_URL, function (err, client) {
    var data = {
      name: request.body.name,
      alias: request.body.alias,
      email: request.body.email,
      interests: request.body.interests,
      latitude: request.body.latitude,
      longitude: request.body.longitude
    };

    client.query("SELECT * FROM users WHERE alias = ($1)", [data.alias], function(err, result) {
      if (result.rowCount) {
        console.log('username already taken');
        return response.json({code: 401, error: "username already taken"});
      } else {
        client.query("INSERT INTO users(name, alias, email, interests, latitude, longitude) values($1, $2, $3, $4, $5, $6)", [data.name, data.alias, data.email, data.interests, data.latitude, data.longitude], function(err, result) {
          // After all data is returned, close connection and return results
          response.render("viewUsers.html");
          response.end();
        });
      }
    });
  });
}

exports.update = function (request, response) {
  var updateQuery = [];
  var keys = _.keys(request.body);

  for (var i = 0; i < keys.length; i++) {
    updateQuery[i] = " " + keys[i] + " = '" + request.body[keys[i]] + "'";
  }
  updateQuery = updateQuery.join();

  pg.connect(config.DATABASE_URL, function (err, client) {
    client.query("UPDATE users SET" + updateQuery + " WHERE id = ($1)", [request.params.id]);
    response.sendStatus(200);
  });
}

exports.delete = function (request, response) {
  pg.connect(config.DATABASE_URL, function (err, client) {
    client.query("DELETE FROM users WHERE id = ($1)", [request.params.id]);
    response.sendStatus(200);
  });
};

exports.get = function (request, response) {
  var id = request.params.id;

  var query = client.query("SELECT * FROM users WHERE id = ($1)", [id]);

  // Stream results back one row at a time
  query.on('row', function (row, result) {
    result.addRow(row);
  });

  // After all data is returned, close connection and return results
  query.on('end', function (result) {
    if (result.rowCount) {
      return response.json(createUserFromResult(result));
    } else {
      response.sendStatus(404);
    }
  });
};

exports.getAll = function (request, response) {
  pg.connect(config.DATABASE_URL, function (err, client) {
    var query = client.query("SELECT * FROM users ORDER BY id ASC;");

    // Stream results back one row at a time
    query.on('row', function (row, result) {
      result.addRow(row);
    });

    // After all data is returned, close connection and return results
    query.on('end', function (result) {
      var jsonObject = {"users": [], metadata: {version: 0.1, count: result.rowCount}};
      for (var i = 0; i < result.rowCount; i++) {
        var oneUser = {
          user: {
            id: result.rows[i].id,
            name: result.rows[i].name,
            alias: result.rows[i].alias,
            email: result.rows[i].email,
            location: {
              latitude: result.rows[i].latitude,
              longitude: result.rows[i].longitude
            }
          }
        }
        jsonObject.users.push(oneUser);
      }
      return response.json(jsonObject);
    });
  });
};

exports.getCandidate = function (request, response) {
  response.sendStatus(200);
}

exports.form_newUser = function (request, response) {
  response.render('newUser.html');
};

exports.form_viewUser = function (request, response) {
  response.render('viewUsers.html');
};
