var through = require('through2');

module.exports = function (db) {
    return function (opts) {
        if (!opts) opts = {};
        if (!opts.start) opts.start = undefined;
        if (!opts.end) opts.end = null;
        return db.createReadStream({
            start: [ 'song-time', opts.start ],
            end: [ 'song-time', null ],
            reverse: true,
            limit: Number(opts.limit) || 500
        }).pipe(through.obj(write));
    };
};

function write (row, enc, next) {
    this.push({
        time: row.key[1],
        name: row.key.slice(2).join('/')
    });
    next();
};
