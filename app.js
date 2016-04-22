var express = require('express');
var app = express();
var pg = require('pg');
var config = require('./config');
var bodyParser = require('body-parser');

//Set: Puerto
app.set('port', (process.env.PORT || 3000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());   

// Set: Carpeta Views para las vistas de la api
app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

// Set: Motor de vistas, habilito para vistas html
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');



//------------- Rutas Api Rest -----------------//

/*Ruta base*/
app.get('/', function(request, response) {
  	//response.render('pages/index');
	response.render('pages/main.html');
});

/*GET usuarios*/
app.get('/usuarios', function(request, response) {

	var user_json = {"nombre":"heber","apellido":"gonzalez"};
	response.send(JSON.stringify(user_json));
	console.log(JSON.stringify(user_json));
});

app.get('/items', function(request, response) {

	pg.connect(config.DATABASE_URL, function(err, client) {
		var results = [];
		var query = client.query("SELECT * FROM items ORDER BY id ASC;");

		// Stream results back one row at a time
		query.on('row', function(row) {
		    results.push(row);
		});

		// After all data is returned, close connection and return results
		query.on('end', function() {
		    if (results.length == 0) 
			{
			 console.log("nada");
			 response.send("No hay nada en la tabla.");
			}
			else
		    return response.json(results);
		});
	});

	//response.send(JSON.stringify(user_json));
	//console.log(JSON.stringify(user_json));
});

app.post('/items', function(request, response) {
	
	var results = [];
	pg.connect(config.DATABASE_URL, function(err, client) {


		var data = {text: request.body.text, complete: request.body.complete};
		client.query("INSERT INTO items(text, complete) values($1, $2)", [data.text, data.complete]);
		var query = client.query("SELECT * FROM items ORDER BY id ASC");
		 query.on('row', function(row) {
		    results.push(row);
		});

		// After all data is returned, close connection and return results
		query.on('end', function() {
		    return response.json(results);
		});
	});
});


//----------------Fin Rutas---------------------//


// Set: Conecto el puerto con la api
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

pg.defaults.ssl = true;

// Conexion a Base de Datos de Postgree hosteada en Heroku
/*
pg.connect(config.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Conectado a Postgres');
  console.log(config.DATABASE_URL);
  client.query('SELECT table_schema,table_name FROM information_schema.tables;').on('row', function(row) {
    console.log(JSON.stringify(row));
  });
});
*/

//Creo la tabla de la base de datos //
pg.connect(config.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Creando tabla si no existe');
  var query = client.query('CREATE TABLE IF NOT EXISTS items(id SERIAL PRIMARY KEY, text VARCHAR(40) not null, complete BOOLEAN)');
  query.on('end', function() { client.end(); });
  
});

