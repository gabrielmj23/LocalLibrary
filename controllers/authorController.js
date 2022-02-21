var Author = require('../models/author');
var Book = require('../models/book');
var async = require('async');
const { body, validationResult } = require('express-validator');

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
    res.render('author_form', {title: 'Create Author'});
};

// Handle author create on POST
exports.author_create_post = [
    // Validate and sanitize
    body('first_name').trim().isLength({min: 1}).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({min: 1}).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth.').optional({checkFalsy: true}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death.').optional({checkFalsy: true}).isISO8601().toDate(),

    // Process request
    (req, res, next) => {
        // Extract errors from request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // There are errors
            res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array()});
            return;
        }
        else {
            // Create Author with valid data
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                }
            );
            author.save(function(err) {
                if (err) { return next(err); }
                // Successful
                res.redirect(author.url);
            });
        }
    }
];

// Author delete on GET
exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback);
        },
        authors_books: function(callback) {
            Book.find({'author': req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // No results
        if (results.author == null) {
            res.redirect('/catalog/authors');
        }
        // Successful, so render
        res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.authors_books});
    });
};

// Author delete POST
exports.author_delete_post = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid).exec(callback);
        },
        authors_books: function(callback) {
            Book.find({'author': req.body.authorid}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.authors_books.length > 0) {
            // Author has books left to delete
            res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.authors_books});
            return;
        }
        else {
            // Author has no books, so delete
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                // Success
                res.redirect('/catalog/authors');
            });
        }
    });
};

// Author update GET
exports.author_update_get = function(req, res) {
    res.send('Author update GET');
};

// Author update POST
exports.author_update_post = function(req, res) {
    res.send('Author update POST');
};