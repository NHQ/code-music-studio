var svg = document.querySelector('svg');
var fft = require('ndarray-fft');
var mag = require('ndarray-complex').mag;
var baudio = require('webaudio');
var slideways = require('slideways');

var slider = slideways({
    min: 0.001,
    max: 3,
    init: Math.log(50) / Math.log(10)
});
slider.appendTo('#slider');

var rate = 44000;
var duration = 1 / 50;

slider.on('value', function (x) {
    duration = Math.pow(10, -x);
    computeWave();
});

var style = window.getComputedStyle(svg);
var width = parseInt(style.width), height = parseInt(style.height);
var p = svg.querySelector('polyline');
svg.appendChild(p);

function computeWave () {
    var points = [];
    var samples = 500;
    for (var i = 0; i < samples; i++) {
        var t = i / samples * duration;
        var res = Math.max(-1, Math.min(1, music(t)));
        var x = width * (i / samples);
        var y = (res + 1) / 2 * (height - 200) + 100;
        points.push(x + ',' + y);
    }
    p.setAttribute('points', points.join(' '));
}
setInterval(computeWave, 500);

var music = function (t) { return 0 };
var code = document.querySelector('#code');
code.addEventListener('keydown', onchange);
code.addEventListener('change', onchange);
code.addEventListener('keyup', onchange);
onchange();

var lastErr, lastSrc;
function onchange () {
    try { music = Function(code.value)() }
    catch (err) {
        if (String(err) !== lastErr) console.log(err);
        lastErr = String(err);
        return;
    }
    if (lastSrc !== code.value) computeWave(music);
    lastSrc = code.value;
}

var b = baudio(function (t) {
    return music(t);
});
b.play();
