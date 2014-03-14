var fs = require('fs');
var html = fs.readFileSync(__dirname + '/scope.html', 'utf8');
var domify = require('domify');

var slideways = require('slideways');
module.exports = Scope;

function Scope (opts) {
    var self = this;
    if (!(this instanceof Scope)) return new Scope(opts);
    if (!opts) opts = {};
    
    this.element = domify(html)[0];
    this.durationSlider = slideways({
        min: -1,
        max: 3,
        init: Math.log(50) / Math.log(10)
    });
    this.durationSlider.on('value', function (x) {
        self.setDuration(Math.pow(10, -x));
    });
    this.durationSlider.appendTo(this.element);
    
    this.svg = createElement('svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    
    var p = this.polyline = createElement('polyline');
    p.setAttribute('stroke', opts.stroke || 'cyan');
    p.setAttribute('stroke-width', opts.strokeWidth || '4px');
    p.setAttribute('fill', 'transparent');
    
    this.svg.appendChild(this.polyline);
    this.duration = opts.duration || 1 / 50;
}

Scope.prototype.appendTo = function (target) {
    if (typeof target === 'string') target = document.querySelector(target);
    target.appendChild(this.svg);
    this._target = target;
    this.resize();
};

Scope.prototype.setDuration = function (d) {
    this.duration = d;
    this._rewave();
};

Scope.prototype._rewave = function () {
    if (this._lastWave) this.wave(this._lastWave[0], this._lastWave[1]);
};

Scope.prototype.resize = function () {
    if (!this._target) return;
    var style = window.getComputedStyle(this._target);
    this.width = parseInt(style.width);
    this.height = parseInt(style.height);
    this._rewave();
};

Scope.prototype.wave = function (f, samples) {
    this._lastWave = [ f, samples ];
    
    if (samples === undefined) samples = 500;
    var points = [];
    for (var i = 0; i < samples; i++) {
        var t = i / samples * this.duration;
        var res = Math.max(-1, Math.min(1, f(t)));
        var x = this.width * (i / samples);
        var y = (res + 1) / 2 * (this.height - 25 * 2) + 10;
        points.push(x + ',' + y);
    }
    this.polyline.setAttribute('points', points.join(' '));
};

function createElement (name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
