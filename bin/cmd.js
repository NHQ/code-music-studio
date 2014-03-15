#!/usr/bin/env node

var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/..');
var server = http.createServer(ecstatic);
server.listen(parseInt(process.argv[2]) || 0);

server.on('listening', function () {
    console.log('listening on http://localhost:' + server.address().port);
});
