// Include gulp
var gulp = require('gulp');

// Include gulp plugins
var $ = require('gulp-load-plugins')(),
    sequence = require('run-sequence'),
    merge = require('merge-stream'),
    del = require('del');

// Base paths
var basePaths = {
    assets: 'assets/',
    dest: 'public/',
    vendor: 'assets/vendor/',
};

var paths = {

    scss: {
        folder: basePaths.assets + 'scss/**/*.scss',
        src: [
            basePaths.assets + 'scss/scaffold.scss',
        ],
        dest: basePaths.dest + 'css/',
        destName: 'app.css'
    },

    javascript: {
        folder: basePaths.assets + 'javascript/**/*.js',
        src: [
            'path/to/js/files/here'
        ],
        dest: basePaths.dest + 'javascript/',
        destName: 'app.js',
    },

    pug: {
        folder: basePaths.assets + 'pug/**/*.pug',
        src: [
            'path/to/pug/files/here'
        ],
        dest: basePaths.dest,
    },

    images: {
        src: basePaths.assets + 'images/**/*.{jpg, png}',
        dest: basePaths.dest + 'images/',
    }
};

gulp.task('build:scss', ['clean:css'], function() {
    return gulp.src(paths.scss.src)
        .pipe($.plumber())
        .pipe($.debug({title: 'scss:build'}))
        .pipe($.sass({
            outputStyle: 'expand',
            outFile: paths.scss.destName 
        }))
        .on('error', $.sass.logError)
        .pipe($.autoprefixer('last 2 version'))
        .pipe($.rename(paths.scss.destName))
        .pipe($.debug({title: 'scss:dest'}))
        .pipe(gulp.dest(paths.scss.dest));
});

gulp.task('clean:css', function() {
    return del([
        paths.scss.dest
    ]);
});

gulp.task('build:javascript', ['lint:javascript'], function() {
    return gulp.src(paths.javascript.src)
        .pipe($.plumber())
        .pipe($.debug({title: 'build:javascript '}))
        //.pipe($.uglify())
        .pipe($.concat(paths.javascript.destName))
        .pipe(gulp.dest(paths.javascript.dest));
});

gulp.task('lint:javascript', function() {
    return gulp.src(paths.javascript.folder)
        .pipe($.jshint())
        .pipe($.notify(function (file) {
            if (file.jshint.success) {
                return false;
            }

            var errors = file.jshint.results.map(function (data) {
                if (data.error) {
                    return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
                }
            }).join("\n");
            return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
        }));
});

gulp.task('pug', function() {
    var build = gulp.src(paths.pug.src)
        .pipe($.debug({title: 'pug'}))
        .pipe($.plumber())
        .pipe($.pug())
        .pipe(gulp.dest(paths.pug.dest));

    return merge(build);
});

gulp.task('optimise:images', ['clean:images'], function() {

    var copy = gulp.src(paths.images.src)
        .pipe(gulp.dest(paths.images.dest));

    var minify =  gulp.src(paths.images.src)
        .pipe($.imagemin({
            progressive: true
        }))
        .pipe(gulp.dest(paths.images.dest));

    return merge(copy, minify);
});

gulp.task('clean:images', function() {
    return del([
        paths.images.dest
    ]);
});


gulp.task('build', function(done) {
    $.sequence(['pug', 'build:javascript', 'optimise:images', 'build:scss'], done);
});

gulp.task('watch', function() {
    // Watch pug
    var pug = $.watch(paths.pug.folder, function() {
        gulp.start('pug');
    });

    var javascript = $.watch(paths.javascript.folder, function() {
        gulp.start('build:javascript');
    });

    var images = $.watch(paths.images.src, function() {
        gulp.start('optimise:images');
    });

    var scss = $.watch(paths.scss.folder, function() {
        gulp.start('build:scss');
    });

    return merge(pug, javascript, images, scss);
});

gulp.task('default', function(done) {
    $.sequence('build', 'watch', done);
});
