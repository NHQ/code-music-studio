var scope = require('./lib/scope.js')();
scope.appendTo(document.body);
window.addEventListener('resize', function (ev) { scope.resize() });

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
    scope.setDuration(Math.pow(10, -x));
});

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
    if (lastSrc !== code.value) scope.wave(music, 500);
    lastSrc = code.value;
}

var floats = new Float32Array(44000 / 8);
var floatIx = 0;
var b = baudio(function (t) {
    var x = music(t);
    floats[floatIx % floats.length] = x;
    return x;
});
b.play();
