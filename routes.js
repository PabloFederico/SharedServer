'use strict';

function authenticateAndRun(app) {
	return app.passport.authenticate('local');
}

function ensureLocation(request, response, next) {
	if (!request.query || !request.query.latitude || !request.query.longitude || !request.query.radius) {
		return response.status(400).json({error: "Location should be provided"});
	}
	return next();
}

exports = module.exports = function(app) {
	app.post('/login', authenticateAndRun(app), require('./api/user').login);
	app.get('/users/:id', require('./api/user').get);
	app.get('/users', require('./api/user').getAll);
	app.post('/users', require('./api/user').create);
	app.put('/users/:id', require('./api/user').update);
	app.delete('/users/:id', require('./api/user').delete);
	app.get('/interests', require('./api/interest').getAll);
	app.post('/interests', require('./api/interest').create);
	app.delete('/interests/:id', require('./api/interest').delete);
	app.get('/users/:id/photo', require('./api/user').getProfilePhoto);
	app.get('/users/:user/profile', require('./api/user').getProfile);
	app.get('/users/:user/candidates', ensureLocation, require('./api/user').getCandidates);
	app.get('/form_newUser', require('./api/user').form_newUser);
	app.get('/form_viewUser', require('./api/user').form_viewUser);
	app.get('/form_editUser', require('./api/user').form_editUser);
	app.get('/form_newInterest', require('./api/user').form_newInterest);
	app.get('/form_viewInterests', require('./api/user').form_viewInterests);
	app.get('/form_viewUserInterest', require('./api/user').form_viewUserInterest);
};
