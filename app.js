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

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});   

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

/*FORM view User*/
app.get('/form_viewUser', function(request, response) {
	response.render('pages/viewUsers.html');
});

/*GET users*/
app.get('/users', function(request, response) {

	pg.connect(config.DATABASE_URL, function(err, client) {
		var results = [];
		var query = client.query("SELECT * FROM usuarios ORDER BY id ASC;");

		// Stream results back one row at a time
		query.on('row', function(row,result) {
		    result.addRow(row);
		});

		// After all data is returned, close connection and return results
		query.on('end', function(result) {
		var jsonObject = { "users" : [] , metadata : { version : 0.1 , count : result.rowCount}}
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
		      return response.status(201);
		});
	});
});


/* DELETE user*/
app.delete('/users/:id', function(request,response) {

	var results = [];
	var id = request.params.id;
	pg.connect(config.DATABASE_URL, function(err, client) {

		client.query("DELETE FROM usuarios WHERE id = ($1)", [id]);
		return response.status(200);
	});
	
});

/*GET one user*/
app.get('/users/:id', function(request, response) {

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
		 	         }
 		       return response.json(jsonObject);
		    }
		    else{
			response.sendStatus(404);			
		    }
		   
	       });		
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

