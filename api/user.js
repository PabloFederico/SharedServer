"use strict";

var userService = require('../service/userService')();

exports.login = function (request, response) {
  if (!request.user) {
    return response.json({success: false, error: "Invalid Login"});
  }
  return response.json(request.user);
};

exports.create = function (request, response) {
  userService.create(request.body, function (err, result) {
    if (err) {
      return response.status(500).json({error: err.message});
    }
    return response.status(200).json({message: "Successful signup"});
  });
};

exports.update = function (request, response) {
  userService.update(request.params.id, request.body, function (err, result) {
    if (err) {
      return response.status(500).json({error: "An error ocurred processing the request"});
    }
    return response.status(200).json({message: ""});
  });
};

exports.delete = function (request, response) {
  userService.delete(request.params.id, function (err, result) {
    if (err) {
      return response.status(500).json({error: "An error ocurred processing the request"});
    }
    return response.status(200).json({message: ""});
  });
};

exports.get = function (request, response) {
  userService.get(request.params.id, function (err, result) {
    if (err) {
      var message = err.message ? err.message : "An error ocurred processing the request";
      return response.status(500).json({error: message});
    }
    return response.status(200).json(result);
  });
};

exports.getAll = function (request, response) {
  userService.getAll(function (err, result) {
    if (err) {
      return response.status(500).json({error: ""});
    }
    return response.status(200).json(result);
  });
};

exports.getProfilePhoto = function (request, response) {
  userService.getProfilePhoto(request.params.id, function (err, result) {
    if (err) {
      return response.status(500).json({error: "An error ocurred processing the request"});
    }
    return response.status(200).json(result);
  });
};

exports.getProfile = function (request, response) {
  userService.getProfile(request.params.user, function (err, result) {
    if (err) {
      return response.status(500).json({error: "An error ocurred processing the request"});
    }
    return response.status(200).json(result);
  });
};

exports.getCandidates = function (request, response) {
    var location = {
      latitude: request.query.latitude,
      longitude: request.query.longitude
    };
    userService.getCandidates(request.params.user, location, request.query.radius, function (err, result) {
      if (err) {
        var message = err.message ? err.message : "An error ocurred processing the request";
        return response.status(400).json({error: message});
      }
      return response.status(200).json(result);
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

exports.form_viewUserInterest = function (request, response) {
  response.render('viewUserInterest.html');
};
