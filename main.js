var baudio = require('webaudio');
var observable = require('observable');

var scope = require('./lib/scope.js')();
scope.appendTo('#scope');

var paused = false;
scope.on('click', function () { paused = !paused });

window.addEventListener('resize', function (ev) { scope.resize() });

var music = function (t) { return 0 };
var code = document.querySelector('#code');

observable.input(code)(function (source) {
    try { music = Function(source)() }
    catch (err) { return console.log(err) }
    scope.wave(music, 500);
});

var time = 0;
setInterval(function () {
    if (!paused) scope.setTime(time);
}, 50);

var b = baudio(function (t) {
    time = t;
    if (paused) return 0;
    return music(t);
});
b.play();
