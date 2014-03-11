var svg = document.querySelector('svg');
var fft = require('ndarray-fft');
var mag = require('ndarray-complex').mag;
var baudio = require('webaudio');

var p = svg.querySelector('polyline');
var points = [];

var width = 600, height = 500;
p.setAttribute('points', points.join(' '));

svg.appendChild(p);

var rate = 44000;
var duration = 1 / 100;

setInterval(function () {
    points = [];
    for (var i = 0; i < 100; i++) {
        var t = i / 100 * duration;
        var res = music(t);
        var x = width * (i / 100);
        var y = (res + 1) / 2 * height;
        points.push(x + ',' + y);
    }
    p.setAttribute('points', points.join(' '));
}, 250);

var music = function (t) { return 0 };
var code = document.querySelector('#code');
code.addEventListener('keydown', onchange);
code.addEventListener('change', onchange);
code.addEventListener('keyup', onchange);
onchange();

function onchange () {
    try { music = Function(code.value)() }
    catch (err) {
        console.log(err);
    }
    console.log('music=', music);
}

var b = baudio(function (t) { return music(t) });
b.play();
