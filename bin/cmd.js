#!/usr/bin/env node

var http = require('http');
var server = http.createServer(ecstatic);
var ecstatic = require('ecstatic')(__dirname + '/..');
server.listen(parseInt(process.argv[2]) || 0);

server.on('listening', function () {
    console.log('listening on :' + server.address().port);
});
