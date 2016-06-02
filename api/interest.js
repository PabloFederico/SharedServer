"use strict";
var pg = require('pg');
var config = require('../config');

exports.create = function (request, response) {
	pg.connect(config.DATABASE_URL, function (err, client,done) {
    var data = {
      category: request.body.category,
      value: request.body.value
    };

    var query = client.query("INSERT INTO interests(category, value) values($1, $2)", [data.category, data.value]);

    // After all data is returned, close connection and return results
    query.on('end', function () {
      done();
      response.render("viewInterests.html");
      response.end();
    });
  });
}

exports.delete = function (request, response) {
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("DELETE FROM interests WHERE id = ($1)", [request.params.id], function (err) {
      //done();
      if (err) {
        console.log(err);
        response.sendStatus(500);
      } else {
        response.sendStatus(200);
      }
    });
  });
};

exports.getAll = function (request, response) {
	pg.connect(config.DATABASE_URL, function (err, client,done) {
		var query = client.query("SELECT * FROM interests ORDER BY id ASC;");

    // Stream results back one row at a time
    query.on('row', function (row, result) {
    	result.addRow(row);
    });

    // After all data is returned, close connection and return results
    query.on('end', function (result) {
      done();
    	var jsonObject = {"interests": [], metadata: {version: 0.1, count: result.rowCount}};
    	for (var i = 0; i < result.rowCount; i++) {
    		var oneInterest = {
    			interest: {
            id: result.rows[i].id,
    				category: result.rows[i].category,
    				value: result.rows[i].value
    			}
    		}
    		jsonObject.interests.push(oneInterest);
    	}
    	return response.json(jsonObject);
    });
  });
}
