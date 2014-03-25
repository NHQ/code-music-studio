#!/usr/bin/env node
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var trumpet = require('trumpet');
var concat = require('concat-stream');
var qs = require('querystring');
var encode = require('ent').encode;
var lexi = require('lexicographic-integer');

var argv = minimist(process.argv.slice(2), {
    alias: { p: 'port', d: 'datadir' },
    default: { datadir: '.' }
});
var port = parseInt(process.env.PORT) || argv.port || 8000;
var ecstatic = require('ecstatic')(__dirname + '/static');

var level = require('level');
var bytewise = require('bytewise');
var datadir = path.join(
    process.env.DATADIR || argv.datadir,
    'code-music-studio.db'
);
var db = level(datadir, { keyEncoding: bytewise, valueEncoding: 'json' });

function getSong (parts, params, cb) {
    var key = [ 'songs', parts ];
    if (params.time) {
        key.push(lexi.pack(parseInt(params.time,10)));
        return db.get(key, function (err, song) {
            if (err) cb(err)
            else cb(null, song)
        });
    }
    var opts = { start: key, end: key.concat(null) };
    var s = db.createReadStream(key, { limit: 1, reverse: true });
    var found = false;
    s.on('data', function (row) {
        found = true;
        cb(null, row.value);
    });
    s.on('end', function () {
        if (!found) cb('not found');
    });
}

var server = http.createServer(function (req, res) {
    var u = url.parse(req.url), m = req.method;
    try { var parts = decodeURIComponent(u.pathname).split('/').slice(1) }
    catch (err) { return respond(400, err) }
    var params = qs.parse(u.query);
    
    if (m === 'POST' && /\.json$/.test(u.pathname)) {
        parts[parts.length-1] = parts[parts.length-1].replace(/\.json$/, '');
        var key = [ 'songs', parts, lexi.pack(Date.now()) ];
        req.pipe(concat(function (body) {
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
        getSong(parts, params, function (err, song) {
            if (err) respond(500, '// ' + err)
            else res.end(song.code)
        });
    }
    else if (m === 'GET' && parts[0] !== '-') {
        var tr = trumpet();
        var s = tr.createWriteStream('#code');
        var title = encode(parts.join('/'));
        tr.select('#save *[name=title]').setAttribute('value', title);
        readStream('index.html').pipe(tr).pipe(res);
        
        getSong(parts, params, function (err, song) {
            if (err) {
                s.write('// ' + err + '\n');
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
    return fs.createReadStream(path.join(__dirname, 'static', file));
}
