var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find()
      .sort([['name', 'ascending']])
      .exec(function(err, list_genres) {
          if (err) { return next(err); }
          // Successful, so render
          res.render('genre_list', {title: 'Genre List', genre_list: list_genres});
      });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        
        genre_books: function(callback) {
            Book.find({'genre': req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // No results
        if (results.genre == null) {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    // Validate and sanitize name field
    body('name', 'Genre name required').trim().isLength({min: 1}).escape(),

    // Process request after validation and sanitization
    (req, res, next) => {
        // Extract validation errors
        const errors = validationResult(req);

        // Create genre object
        var genre = new Genre(
            {name: req.body.name}
        );

        if (!errors.isEmpty()) {
            // Render again with error messages
            res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()});
            return;
        }
        else {
            // Valid data
            // Check if it's a repeated genre
            Genre.findOne({'name': req.body.name})
              .exec(function(err, found_genre) {
                  if (err) { return next(err); }

                  if (found_genre) {
                      // Redirect to existing genre's detail page
                      res.redirect(found_genre.url);
                  }
                  else {
                      genre.save(function(err) {
                          if (err) { return next(err); }
                          res.redirect(genre.url);
                      });
                  }
              });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({'genre': req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // No results
        if (results.genre == null) {
            res.redirect('/catalog/genres');
        }
        // Successful, so render
        res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, books: results.genre_books});
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({'genre': req.body.genreid}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.genre_books.length > 0) {
            // There are books left to delete
            res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, books: results.genre_books});
        }
        else {
            // All fine, delete
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) { return next(err); }
                // Success
                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findOne({'_id': req.params.id}).exec(function(err, curGenre) {
        if (err) { return next(err); }
        // No results
        if (curGenre == null) {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Success, render
        res.render('genre_form', {title: 'Update Genre', genre: curGenre});
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    // Validate and sanitize
    body('name', 'Genre name required').trim().isLength({min: 1}).escape(),

    // Process request
    (req, res, next) => {
        // Extract validation errors
        const errors = validationResult(req);

        // Create genre object
        genre = new Genre(
            {
                name: req.body.name,
                _id: req.params.id
            }
        );
        if (!errors.isEmpty()) {
            // There are errors
            res.render('genre_form', { title: 'Update Genre', genre: genre, errors: errors.array()});
            return;
        }
        else {
            // Update record with valid data
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, newGenre) {
                if (err) { return next(err); }
                // Successful
                res.redirect(newGenre.url);
            });
        }
    }
];