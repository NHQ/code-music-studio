var baudio = require('webaudio');
var observable = require('observable');

var scope = require('./lib/scope.js')();
scope.appendTo('#scope');

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
    scope.setTime(time);
}, 1000);

var b = baudio(function (t) {
    time = t;
    return music(t);
});
b.play();
