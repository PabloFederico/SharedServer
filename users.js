var express = require('express');
var app = express();
var pg = require('pg');
var config = require('./config');
var bodyParser = require('body-parser');

//Set: Puerto
app.set('port', (process.env.PORT || 3000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));   

// Set: Carpeta Views para las vistas de la api
app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

// Set: Motor de vistas, habilito para vistas html
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');



//------------- Rutas Api Rest -----------------//

/*Ruta base*/
app.get('/', function(request, response) {
	response.render('pages/main.html');
});

/*FORM new User*/
app.get('/form_newUser', function(request, response) {
	response.render('pages/newUser.html');
});

/*GET users*/
app.get('/users', function(request, response) {

	pg.connect(config.DATABASE_URL, function(err, client) {
		var results = [];
		var query = client.query("SELECT * FROM usuarios ORDER BY id ASC;");

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
		//response.send(JSON.stringify(user_json));
		//console.log(JSON.stringify(user_json));
	});
});

/*POST users */
app.post('/users', function(request, response) {
	
	var results = [];
	pg.connect(config.DATABASE_URL, function(err, client) {


		var data = {nombre: request.body.nombre, alias: request.body.alias, email: request.body.email, lat: request.body.latitud, long: request.body.longitud};
		client.query("INSERT INTO usuarios(name, email, alias, latitud, longitud) values($1, $2, $3, $4, $5)", [data.nombre, data.alias,data.email,data.lat,data.long]);

		var query = client.query("SELECT * FROM usuarios ORDER BY id ASC");
		 query.on('row', function(row) {
		    results.push(row);
		});

		// After all data is returned, close connection and return results
		query.on('end', function() {
		    return response.json(results);
		});
	});
});


/* DELETE user*/
app.delete('/users/:id', function(request,response) {

	var results = [];
	var id = request.params.id;
	pg.connect(config.DATABASE_URL, function(err, client) {

	client.query("DELETE FROM usuarios WHERE id = ($1)", [id]);

	var query = client.query("SELECT * FROM usuarios ORDER BY id ASC");
		query.on('row', function(row) {
		results.push(row);
	});

	// After all data is returned, close connection and return results
	query.on('end', function() {
		return response.json(results);
	});

	});
	
});

/*GET one user*/
app.get('/users/:id', function(request, response) {

	var id = request.params.id;

	pg.connect(config.DATABASE_URL, function(err, client) {
		var results = [];
		var query = client.query("SELECT * FROM usuarios WHERE id = ($1)",[id]);

		// Stream results back one row at a time
		query.on('row', function(row) {
		    results.push(row);
		});

		// After all data is returned, close connection and return results
		query.on('end', function() {
		    if (results.length == 0) 
			{
			 response.sendStatus(404);//NOT FOUND
			}
			else
		    return response.json(results);
		});
		//response.send(JSON.stringify(user_json));
		//console.log(JSON.stringify(user_json));
	});
});




//--------------------------------------Fin Rutas----------------------------------------------------//


// Set: Conecto el puerto con la api
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

pg.defaults.ssl = true;


//Creo la tabla de la base de datos //
pg.connect(config.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Creando tabla en caso de que no existe');
  var query = client.query('CREATE TABLE IF NOT EXISTS usuarios(id SERIAL PRIMARY KEY, name VARCHAR(30), email VARCHAR(30), alias VARCHAR(20), latitud VARCHAR(30), longitud VARCHAR(30))');
  query.on('end', function() { client.end(); });
  
});

