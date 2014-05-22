var fscope = require('frequency-viewer');

module.exports = function () {
    addEventListener('message', function (ev) {
        var reals = fscope.worker(ev.data);
        postMessage(reals);
    });
};
