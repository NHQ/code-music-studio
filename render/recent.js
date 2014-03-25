var strftime = require('strftime');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/recent.html');
var hyperspace = require('hyperspace');

module.exports = function () {
    return hyperspace(html, function (row) {
        return {
            '.date': strftime('%F %T', new Date(row.time)),
            '.link': {
                href: '/' + row.name + '?time=' + row.time,
                _text: row.name
            }
        }
    });
};
