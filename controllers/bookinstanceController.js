var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const { body, validationResult } = require('express-validator');
var async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
      .populate('book')
      .exec(function(err, list_bookinstances) {
          if (err) { return next(err); }
          // Successful, so render
          res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
      });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
      .populate('book')
      .exec(function(err, bookinstance) {
          if (err) { return next(err); }
          // No results
          if (bookinstance == null) {
              var err = new Error('Book copy not found');
              err.status = 404;
              return next(err);
          }
          // Successful, so render
          res.render('bookinstance_detail', {title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance});
      });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
    .exec(function(err, books) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_form', {title: 'Create Book Instance', book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate and sanitize fields
    body('book', 'Book must be specified.').trim().isLength({min: 1}).escape(),
    body('imprint', 'Imprint must be specified.').trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date.').optional({checkFalsy: true}).isISO8601().toDate(),

    // Process request
    (req, res, next) => {
        // Extract errors
        const errors = validationResult(req);

        // Create BookInstance object
        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            }
        );

        if (!errors.isEmpty()) {
            // Render with error messages
            Book.find({}, 'title')
            .exec(function(err, books) {
                if (err) { return next(err); }
                res.render('bookinstance_form', {title: 'Create Book Instance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
            });
            return;
        }
        else {
            // Save valid bookinstance
            bookinstance.save(function(err) {
                if (err) { return next(err); }
                res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) {
        if (err) { return next(err); }
        // No results
        if (bookinstance == null) {
            res.redirect('/catalog/bookinstances');
        }
        // Successful, so render
        res.render('bookinstance_delete', {title: 'Delete Book Instance', bookinstance: bookinstance});
    })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function DeleteBookInstance(err) {
        if (err) { return next(err); }
        // Success
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        },
        books: function(callback) {
            Book.find({}, 'title').exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // No results
        if (results.bookinstance == null) {
            var err = new Error('Book Instance not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('bookinstance_form', {title: 'Update Book Instance', book_list: results.books, selected_book: results.bookinstance.book._id});
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate and sanitize fields
    body('book', 'Book must be specified.').trim().isLength({min: 1}).escape(),
    body('imprint', 'Imprint must be specified.').trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date.').optional({checkFalsy: true}).isISO8601().toDate(),

    // Process request
    (req, res, next) => {
        // Extract validation errors
        const errors = validationResult(req);

        // Create new BookInstance object
        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id
            }
        );

        if (!errors.isEmpty()) {
            // There are errors
            async.parallel({
                bookinstance: function(callback) {
                    BookInstance.findById(req.params.id).populate('book').exec(callback);
                },
                books: function(callback) {
                    Book.find({}, 'title').exec(callback);
                }
            }, function(err, results) {
                if (err) { return next(err); }
                // Render with error messages
                res.render('bookinstance_form', {title: 'Update Book Instance', book_list: results.books, selected_book: results.bookinstance.book._id, errors: errors.array()});
            });
        }
        else {
            // Update record with valid data
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, newBookInstance) {
                if (err) { return next(err); }
                // Success
                res.redirect(newBookInstance.url);
            });
        }
    }
];