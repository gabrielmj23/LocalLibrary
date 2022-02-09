var Author = require('../models/author');

// Display authors
exports.author_list = function(req, res) {
    res.send('Author list');
};

// Display author details
exports.author_detail = function(req, res) {
    res.send('Author detail: ' + req.params.id);
};

// Display author create form on GET
exports.author_create_get = function(req, res) {
    res.send('Author create GET');
};

// Handle author create on POST
exports.author_create_post = function(req, res) {
    res.send('Author create POST');
}

// Author delete on GET
exports.author_delete_get = function(req, res) {
    res.send('Author delete GET');
};

// Author delete POST
exports.author_delete_post = function(req, res) {
    res.send('Author delete POST');
};

// Author update GET
exports.author_update_get = function(req, res) {
    res.send('Author update GET');
};

// Author update POST
exports.author_update_post = function(req, res) {
    res.send('Author update POST');
};