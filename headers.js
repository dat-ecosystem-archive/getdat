var crypto = require('crypto')
var fs = require('fs')
var ndjson = require('ndjson')
var request = require('request')
var transform = require('parallel-transform')
var through = require('through2')

var PARALLEL = 1000
var seen = {}

function getResponse (item, cb) {
  try {
    var r = request(item.url, {time: true, timeout: 10000})
  } catch (e) {
    return error(e)
  }
  r.on('error', function (err) {
    error(err)
  })
  r.on('response', function (re) {
    cb(null, {
      redirects: r._redirect && r._redirect.redirects,
      initialUrl: item.url,
      url: r.uri.href,
      date: new Date(),
      took: r.elapsedTime,
      package_id: item.package_id,
      id: item.id,
      status: re.statusCode,
      headers: re.headers,
    })
    r.abort()
  })
  
  function error (err) {
    var obj = {url: item.url, date: new Date(), package_id: item.package_id, id: item.id, errorMessage: err.message, error: err}
    if (err.code === 'ETIMEDOUT') {
      obj.timeout = true
    }
    cb(null, obj)
  }
}

process.stdin
  .pipe(ndjson.parse())
  .pipe(through.obj(function (obj, enc, next) {
    var self = this
    if (obj.resources) {
      obj.resources.forEach(function (r) {
        var hash = crypto.createHash('sha256').update(r.url).digest('hex')
        if (seen[hash]) return
        self.push(r)
        seen[hash] = true
      })      
    }
    next()
  }))
  .pipe(transform(PARALLEL, getResponse))
  .pipe(ndjson.serialize())
  .pipe(process.stdout)
