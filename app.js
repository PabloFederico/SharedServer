var express = require('express');
var app = express();
var pg = require('pg');
var config = require('./config');

//Set: Puerto
app.set('port', (process.env.PORT || 3000));

app.use(express.static(__dirname + '/public'));

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


//----------------Fin Rutas---------------------//




// Set: Conecto el puerto con la api
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

pg.defaults.ssl = true;


// Conexion a Base de Datos de Postgree hosteada en Heroku
pg.connect(config.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Conectado a Postgres');
  console.log(config.DATABASE_URL);
  client.query('SELECT table_schema,table_name FROM information_schema.tables;').on('row', function(row) {
    console.log(JSON.stringify(row));
  });
});
