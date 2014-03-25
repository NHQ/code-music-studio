var baudio = require('webaudio');
var observable = require('observable');

var music = function (t) { return 0 };
var ascope = require('amplitude-viewer')();
ascope.appendTo('#ascope');

var fscope = require('frequency-viewer')();
fscope.appendTo('#fscope');

var play = document.querySelector('#play');
play.addEventListener('click', togglePlay);
ascope.on('click', togglePlay);

var paused = false;
function togglePlay () {
    paused = !paused;
    this.textContent = paused ? 'play' : 'pause';
}

window.addEventListener('resize', function (ev) {
    ascope.resize();
    fscope.resize();
});

var code = document.querySelector('#code');
observable.input(code)(function (source) {
    try { music = Function(source)() }
    catch (err) { return console.log(err) }
    ascope.draw(music);
});

setInterval(function f () {
    if (paused) return;
    ascope.setTime(time);
    ascope.draw(music);
    fscope.draw(data);
}, 50);

var time = 0;
var data = new Float32Array(4000);
var dataIx = 0;

var b = baudio(function (t) {
    time = t;
    if (paused) return 0;
    var x = music(t);
    data[dataIx++ % data.length] = x;
    return x;
});
b.play();
