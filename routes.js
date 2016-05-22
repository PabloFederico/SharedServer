'use strict';

exports = module.exports = function(app) {
	app.post('/login', require('./api/user').login);
	app.get('/users/:id', require('./api/user').get);
	app.get('/users', require('./api/user').getAll);
	app.post('/users', require('./api/user').create);
	app.put('/users/:id', require('./api/user').update);
	app.delete('/users/:id', require('./api/user').delete);
	app.get('/interest', require('./api/interest').getAll);
	app.post('/interest', require('./api/interest').create);
	app.get('/candidate', require('./api/user').getCandidate);
	//app.post('/profiles', require('./api/profile').getProfiles);
	app.get('/form_newUser', require('./api/user').form_newUser);
	app.get('/form_viewUser', require('./api/user').form_viewUser);
};
