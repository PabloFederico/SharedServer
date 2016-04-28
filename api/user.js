"use strict";

exports.create = function(request, response) {
  var results = [];
  pg.connect(config.DATABASE_URL, function(err, client) {
    var data = {
      nombre: request.body.nombre,
      alias: request.body.alias,
      email: request.body.email,
      lat: request.body.latitud,
      long: request.body.longitud
    };
    var query = client.query("INSERT INTO usuarios(name, email, alias, latitud, longitud) values($1, $2, $3, $4, $5)", [data.nombre, data.alias,data.email,data.lat,data.long]);

    // After all data is returned, close connection and return results
    query.on('end', function() {
      //response.sendStatus(201);
      response.render("../pages/viewUsers.html");
      response.end();
    });
  });
}

exports.delete = function(request, response) {
  var results = [];
  var id = request.params.id;

  pg.connect(config.DATABASE_URL, function(err, client) {
    client.query("DELETE FROM usuarios WHERE id = ($1)", [id]);
    response.sendStatus(200);
  });
};

exports.get = function(request, response) {
  var id = request.params.id;

  pg.connect(config.DATABASE_URL, function(err, client) {
    var results = [];
    var query = client.query("SELECT * FROM usuarios WHERE id = ($1)",[id]);

    // Stream results back one row at a time
    query.on('row', function(row,result) {
        result.addRow(row);
    });

    // After all data is returned, close connection and return results
    query.on('end', function(result) {
      if (result.rowCount){
        var jsonObject = {
          user : {
            id : id,
            name : result.rows[0].name,
            alias : result.rows[0].alias,
            email : result.rows[0].email,
            location : {
              latitude : result.rows[0].latitud,
              longitude : result.rows[0].longitud
            }
          },
          metadata : {
            version : 1.0
          }
        };
        return response.json(jsonObject);
      } else {
        response.sendStatus(404);
      }
    });    
  });
};

exports.getAll = function(request, response) {
  pg.connect(config.DATABASE_URL, function(err, client) {
    var results = [];
    var query = client.query("SELECT * FROM usuarios ORDER BY id ASC;");

    // Stream results back one row at a time
    query.on('row', function(row,result) {
        result.addRow(row);
    });

    // After all data is returned, close connection and return results
    query.on('end', function(result) {
      var jsonObject = { "users" : [] , metadata : { version : 0.1 , count : result.rowCount}};
      for (var i = 0; i < result.rowCount; i++) {
        var oneUser = {
          user : {
            name : result.rows[i].name,
            alias : result.rows[i].alias,
            email : result.rows[i].email,
            location : {
              latitude : result.rows[i].latitud,
              longitude : result.rows[i].longitud
            }
          }
        }
        jsonObject.users.push(oneUser);
      }
      return response.json(jsonObject);
    });
  });
};

exports.form_newUser = function(request, response) {
  response.render('../pages/newUser.html');
};

exports.form_viewUser = function(request, response) {
  response.render('../pages/viewUsers.html');
};
