module.exports = function (db) {
    return function (parts) {
        var key = [ 'songs', parts ];
        return db.createReadStream({
            start: key.concat(undefined),
            end: key.concat(null),
            reverse: true
        });
    }
};
