#!/usr/bin/env node
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var trumpet = require('trumpet');
var concat = require('concat-stream');
var through = require('through');
var qs = require('querystring');
var marked = require('marked');

var argv = minimist(process.argv.slice(2), {
    alias: { p: 'port', d: 'datadir' },
    default: { datadir: '.' }
});
if (argv.h || argv.help) {
    fs.createReadStream(__dirname + '/usage.txt').pipe(process.stdout);
    return;
}

var port = parseInt(process.env.PORT) || argv.port
    || parseInt(argv._[0]) || 8000
;
var ecstatic = require('ecstatic')(__dirname + '/../static');

var level = require('level-party');
var bytewise = require('bytewise');
var datadir = path.join(
    process.env.DATADIR || argv.datadir,
    'code-music-studio.db'
);
var db = level(datadir, { keyEncoding: bytewise, valueEncoding: 'json' });
var getSong = require('../lib/song.js')(db);
var getHistory = require('../lib/history.js')(db);
var getRecent = require('../lib/recent.js')(db);
var render = {
    history: require('../render/history.js'),
    recent: require('../render/recent.js')
};

var server = http.createServer(function (req, res) {
    var u = url.parse(req.url), m = req.method;
    try { var parts = decodeURIComponent(u.pathname).split('/').slice(1) }
    catch (err) { return respond(400, err) }
    var params = qs.parse(u.query);
    
    if (m === 'POST' && /\.json$/.test(u.pathname)) {
        parts[parts.length-1] = parts[parts.length-1].replace(/\.json$/, '');
        var key = [ 'song', parts, Date.now() ];
        req.pipe(concat(function (body) {
            try { var song = JSON.parse(body) }
            catch (err) { return respond(400, err) }
            var rows = [
                { type: 'put', key: key, value: song },
                { type: 'put', key: [ 'song-time', key[2], parts ], value: 0 }
            ];
            db.batch(rows, function (err) {
                if (err) respond(500, err)
                else res.end('ok\n');
            });
        }));
    }
    else if (u.pathname === '/') {
        ecstatic(req, res);
    }
    else if (m === 'GET' && parts[0] !== '-' && /\.js$/.test(u.pathname)) {
        parts[parts.length-1] = parts[parts.length-1].replace(/\.js$/, '');
        getSong(parts, params, function (err, song) {
            if (err) respond(500, '// ' + err)
            else res.end(song.code)
        });
    }
    else if (m === 'GET' && parts[0] === '-' && parts[1] === 'history.json') {
        getHistory(parts.slice(2))
            .pipe(through(function (row) {
                var rec = row.value;
                rec.time = row.key[2];
                this.queue(JSON.stringify(rec) + '\n');
            }))
            .pipe(res)
        ;
    }
    else if (m === 'GET' && parts[0] === '-' && parts[1] === 'history') {
        var first = true;
        getHistory(parts.slice(2)).pipe(render.history()).pipe(res);
    }
    else if (m === 'GET' && parts[0] === '-' && parts[1] === 'recent.json') {
        var write = function (row) {
            this.queue(JSON.stringify(row) + '\n');
        };
        getRecent().pipe(through(write)).pipe(res);
    }
    else if (m === 'GET' && parts[0] === '-' && parts[1] === 'recent') {
        getRecent().pipe(render.recent()).pipe(res);
    }
    else if (m === 'GET' && parts[0] === '-' && parts[1] === 'help') {
        fs.readFile(__dirname + '/../doc/index.markdown', 'utf8',
        function (err, src) {
            if (err) return respond(500, err);
            res.setHeader('content-type', 'text/html');
            res.end(marked(src));
        });
    }
    else if (m === 'GET' && parts[0] !== '-') {
        var tr = trumpet();
        var s = tr.createWriteStream('#code');
        var title = parts.join('/');
        tr.select('#save *[name=title]').setAttribute('value', title);
        var href = encodeURIComponent(title);
        tr.select('.history-link').setAttribute('href', '/-/history/' + href);
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
server.on('listening', function () {
    console.log('listening on http://localhost:' + server.address().port);
});

function readStream (file) {
    return fs.createReadStream(path.join(__dirname, '../static', file));
}
