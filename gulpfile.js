#!/usr/bin/env node

'use strict';

var version = require('./src/version.json');
var path = require('path');

var del = require('del');
var exorcist = require('exorcist');
var gulp = require('gulp');
var browserify = require('browserify');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var vinylSourceStream = require('vinyl-source-stream');
var bower = require('bower');
var streamify = require('gulp-streamify');
var replace = require('gulp-replace');

var DEST = path.join(__dirname, 'dist/');
var src = 'index';
var dst = 'bloomio';
var lightDst = 'bloomio-light';

var browserifyOptions = {
    standalone: 'bloomio',
    // debug: true,
    // insert_global_vars: true, 
//     jshint ignore:line,
    // detectGlobals: true,
    bundleExternal: true
};

gulp.task('version', function(){
  gulp.src(['./package.json'])
    .pipe(replace(/\"version\"\: \"([\.0-9]*)\"/, '"version": "'+ version.version + '"'))
    .pipe(gulp.dest('./'));
  gulp.src(['./bower.json'])
    .pipe(replace(/\"version\"\: \"([\.0-9]*)\"/, '"version": "'+ version.version + '"'))
    .pipe(gulp.dest('./'));
  gulp.src(['./package.js'])
    .pipe(replace(/version\: \'([\.0-9]*)\'/, "version: '"+ version.version + "'"))
    .pipe(gulp.dest('./'));
});

gulp.task('bower', ['version'], function(cb){
    bower.commands.install().on('end', function (installed){
        console.log(installed);
        cb();
    });
});

gulp.task('lint', [], function(){
    return gulp.src(['./*.js', './src/*.js'])
        .pipe(jshint({esversion:6}))
        .pipe(jshint.reporter('default'));
});

gulp.task('clean', ['lint'], function(cb) {
    del([ DEST ]).then(cb.bind(null, null));
});

gulp.task('standalone', ['clean'], function () {
    return browserify('./' + src + '.js', browserifyOptions)
        .ignore('crypto')
        .bundle()
        .pipe(vinylSourceStream(dst + '.js'))
        .pipe(gulp.dest( DEST ));
});

gulp.task('watch', function() {
    gulp.watch(['./src/*.js'], ['lint', 'build']);
});

gulp.task('default', ['version', 'lint', 'clean', 'standalone']);