module.exports = Scope;

function Scope (opts) {
    if (!(this instanceof Scope)) return new Scope(opts);
    if (!opts) opts = {};
    
    this.element = createElement('svg');
    var p = this.polyline = createElement('polyline');
    p.setAttribute('stroke', opts.stroke || 'red');
    p.setAttribute('stroke-width', opts.strokeWidth || '4px');
    
    this.element.appendChild(this.polyline);
    this.duration = opts.duration || 1 / 50;
}

Scope.prototype.appendTo = function (target) {
    if (typeof target === 'string') target = document.querySelector(target);
    target.appendChild(this.element);
    
    var style = window.getComputedStyle(this.element);
    this.width = parseInt(style.width);
    this.height = parseInt(style.height);
};

Scope.prototype.wave = function (f, samples) {
    if (samples === undefined) samples = 500;
    var points = [];
    for (var i = 0; i < samples; i++) {
        var t = i / samples * this.duration;
        var res = Math.max(-1, Math.min(1, f(t)));
        var x = this.width * (i / samples);
        var y = (res + 1) / 2 * (this.height - 100) + 50;
        points.push(x + ',' + y);
    }
    this.polyline.setAttribute('points', points.join(' '));
};

function createElement (name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
