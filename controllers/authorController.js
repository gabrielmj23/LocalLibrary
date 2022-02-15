var Author = require('../models/author');
var Book = require('../models/book');
var async = require('async');

// Display authors
exports.author_list = function(req, res, next) {
    Author.find()
      .sort([['family_name', 'ascending']])
      .exec(function (err, list_authors) {
          if (err) { return next(err); }
          // Successful, so render
          res.render('author_list', {title: 'Author List', author_list: list_authors});
      });
};

// Display author details
exports.author_detail = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback);
        },
        author_books: function(callback) {
            Book.find({'author': req.params.id}, 'title summary')
              .exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // No results
        if (results.author == null) {
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('author_detail', {title: 'Author Detail', author: results.author, author_books: results.author_books});
    });
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