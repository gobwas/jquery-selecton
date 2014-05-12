var gulp = require("gulp");


gulp.task("compile", function() {
    var browserify = require("browserify"),
        buffer     = require('vinyl-buffer'),
        source     = require('vinyl-source-stream'),
        exposify   = require('exposify'),

        bundler;

    bundler = browserify("./src/plugin.js");

//    bundler.external("jquery");

    // Shim jquery module
    exposify.config = {
        "jquery": "jQuery"
    };

    bundler.transform(exposify);

    return bundler.bundle({standalone: 'noscope'})
        .pipe(source('jquery.selecton.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./dist'));
});

gulp.task("tune", function() {
    var replace = require("gulp-replace"),
        plugin;

    plugin = "./dist/jquery.selecton.js";

    return gulp.src(plugin)
        .pipe(replace("window.jQuery", "jQuery"))
        .pipe(gulp.dest("./dist"));
});

gulp.task("wrap", function() {
    var wrap = require("gulp-wrap"),
        plugin;

    plugin = "./dist/jquery.selecton.js";

    return gulp.src(plugin)
        .pipe(wrap({ src: './build/wrapper.txt' }))
        .pipe(gulp.dest("./dist"));
});

gulp.task("uglify", function() {
    var uglify = require("gulp-uglify"),
        rename = require("gulp-rename"),
        plugin;

    plugin = "./dist/jquery.selecton.js";

    return gulp.src(plugin)
        .pipe(uglify())
        .pipe(rename("jquery.selecton.min.js"))
        .pipe(gulp.dest("./dist"));
});

gulp.task("clean", function() {
    var clean = require("gulp-clean");

    return gulp.src("./dist", { read: false }).pipe(clean());
});

gulp.task("dist", function() {
    var wrap   = require("gulp-wrap"),
        format = require("dateformat"),
        fs     = require("fs"),
        now, data;

    now = new Date();

    data = {
        now: format(now, "yyyy-mm-dd HH:MM:ss"),
        year: format(now, "yyyy"),
        pkg: JSON.parse(fs.readFileSync("./package.json"))
    };

    gulp.src("./dist/**.js")
        .pipe(wrap({ src: "./build/banner.txt" }, data, { variable: 'data' }))
        .pipe(gulp.dest("./dist"));
});

gulp.task("default", function(done) {
    var runSequence = require("run-sequence");

    runSequence(
        "clean",
        "compile",
        "tune",
        "wrap",
        "uglify",
        "dist",
    done);
});