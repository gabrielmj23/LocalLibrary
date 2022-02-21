var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator');

var async = require('async');

exports.index = function(req, res) {
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback);
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status: 'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', {title: 'Local Library Home', error: err, data: results});
    });
};

// Display list of all books.
exports.book_list = function(req, res, next) {
    Book.find({}, 'title author')
      .sort({title: 1})
      .populate('author')
      .exec(function(err, list_books) {
          if (err) { return next(err); }
          // Render if successful
          res.render('book_list', {title: 'Book List', book_list: list_books});
      });
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
              .populate('author')
              .populate('genre')
              .exec(callback);
        },
        book_instances: function(callback) {
            BookInstance.find({'book': req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // No results
        if (results.book == null) {
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('book_detail', {title: results.book.title, book: results.book, book_instances: results.book_instances});
    });
};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
    // Get available authors and genres
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres});
    });
};

// Handle book create on POST.
exports.book_create_post = [
    // Convert genre to array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitize fields
    body('title', 'Title must not be empty.').trim().isLength({min: 1}).escape(),
    body('author', 'Author must not be empty.').trim().isLength({min: 1}).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({min: 1}).escape(),
    body('isbn', 'ISBN must not be empty.').trim().isLength({min: 1}).escape(),
    body('genre.*').escape(),

    // Process request
    (req, res, next) => {
        // Extract validation errors
        const errors = validationResult(req);

        // Create Book object
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            }
        );

        if (!errors.isEmpty()) {
            // Render with error values
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                }
            }, function(err, results) {
                if (err) { return next(err); }
                // Mark selected genres as checked
                for (var i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(result.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()});
            });
            return;
        }
        else {
            // Save valid book
            book.save(function(err) {
                if (err) { return next(err); }
                res.redirect(book.url);
            });
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').exec(callback);
        },
        book_instances: function(callback) {
            BookInstance.find({'book': req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // No results
        if (results.book == null) {
            res.redirect('/catalog/books');
        }
        // Successful, so render
        res.render('book_delete', {title: 'Delete Book', book: results.book, bookinstances: results.book_instances});
    });
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.body.bookid).populate('author').exec(callback);
        },
        book_instances: function(callback) {
            BookInstance.find({'book': req.body.bookid}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.book_instances.length > 0) {
            // There are book instances left to delete
            res.render('book_delete', {title: 'Delete Book', book: results.book, bookinstances: results.book_instances});
            return;
        }
        else {
            // All fine, delete
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) { return next(err); }
                // Success
                res.redirect('/catalog/books');
            });
        }
    });
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
    // Get book, authors and genres
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // No results
        if (results.book == null) {
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Success
        // Mark selected genres as checked
        for (var all_g = 0; all_g < results.genres.length; all_g++) {
            for (var book_g = 0; book_g < results.book.genre.length; book_g++) {
                if (results.genres[all_g]._id.toString() === results.book.genre[book_g]._id.toString()) {
                    results.genres[all_g].checked = 'true';
                }
            }
        }
        res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book});
    });
};

// Handle book update on POST.
exports.book_update_post = [
    // Convert genre to array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitize fields
    body('title', 'Title must not be empty.').trim().isLength({min: 1}).escape(),
    body('author', 'Author must not be empty.').trim().isLength({min: 1}).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({min: 1}).escape(),
    body('isbn', 'ISBN must not be empty.').trim().isLength({min: 1}).escape(),
    body('genre.*').escape(),

    // Process request
    (req, res, next) => {
        // Extract validation errors
        const errors = validationResult(req);

        // Create Book object
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
                _id: req.params.id
            }
        );

        if (!errors.isEmpty()) {
            // There are errors
            // Get authors and genres
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                }
            }, function(err, results) {
                if (err) { return next(err); }
                // Mark selected genres as checked
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()});
            });
            return;
        }
        else {
            // Update record with valid data
            Book.findByIdAndUpdate(req.params.id, book, {}, function(err, newBook) {
                if (err) { return next(err); }
                // Successful, redirect to new book page
                res.redirect(newBook.url);
            });
        }
    }
];