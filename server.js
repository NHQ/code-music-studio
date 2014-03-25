#!/usr/bin/env node
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var trumpet = require('trumpet');
var concat = require('concat-stream');
var qs = require('querystring');

var argv = minimist(process.argv.slice(2), {
    alias: { p: 'port', d: 'datadir' },
    default: { datadir: '.' }
});
var port = parseInt(process.env.PORT) || argv.port || 8000;
var ecstatic = require('ecstatic')(__dirname + '/static');

var level = require('level');
var bytewise = require('bytewise');
var datadir = path.join(process.env.DATADIR || argv.datadir, 'code.db');
var db = level(datadir, { keyEncoding: bytewise, valueEncoding: 'json' });

var server = http.createServer(function (req, res) {
    var u = url.parse(req.url), m = req.method;
    var parts = u.pathname.split('/').slice(1);
    var params = qs.parse(u.query);
    
    if (m === 'POST' && /\.json$/.test(u.pathname)) {
        var key = [ 'songs', parts, Date.now() ];
        res.pipe(concat(function (body) {
            try { var song = JSON.parse(body) }
            catch (err) { return respond(400, err) }
            db.put(key, song, function (err) {
                if (err) respond(500, err)
                else res.end('ok\n');
            });
        }));
    }
    else if (u.pathname === '/') {
        ecstatic(req, res);
    }
    else if (m === 'GET' && parts[0] !== '-' && /\.js$/.test(u.pathname)) {
        var key = [ 'songs', parts ];
        if (params.time) {
            key.push(parseInt(params.time,10));
            return db.get(key, function (err, song) {
                if (err) respond(err)
                else res.end(song.code);
            });
        }
        var opts = { start: key, end: key.concat(null) };
        var s = db.createReadStream(key, { limit: 1, reverse: true });
        var found = false;
        s.on('data', function (row) {
            found = true;
            res.end(row.code);
        });
        s.on('end', function () {
            if (!found) respond(200, '// not found');
        });
    }
    else if (m === 'GET' && parts[0] !== '-' && !/\.\w+$/.test(u.pathname)) {
        var key = [ 'songs', parts ];
        var tr = trumpet();
        var s = tr.createWriteStream('#code');
        readStream('index.html').pipe(tr).pipe(res);
        
        db.get(key, function (err, song) {
            if (err) {
                s.write('// no such song\n');
                s.end('return function (t) {\n  return 0\n}');
            }
            else s.end(song.code);
        });
    }
    else {
        req.url = req.url.replace(/^\/\-\//, '/');
        ecstatic(req, res);
    }
    
    function respond (code, err) {
        res.statusCode = code;
        res.end(err + '\n');
    }
});
server.listen(port);

function readStream (file) {
    return fs.createReadStream(path.join(__dirname, file));
}
