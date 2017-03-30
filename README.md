# getdat

Bulk data and/or metadata downloader for large lists of HTTP and FTP urls. Note that the FTP downloader is still a work in progress.

these scripts assume ndjson as input

### headers.js

does an HTTP GET for each URL in parallel, then aborts each request when the headers come back. prints ndjson to stdout that includes the http headers and other GET statistics. can do roughly ~1 million urls in a couple of hours on one machine

example:

```
cat data.json | node headers.js > headers.json
```

this script was written to match the data.gov structure, so data should look like this (or you can edit the program if your data looks differently)

```
{id: 'foo', resources: [{url: 'http://someurl'}, {url: 'http://someotherurl'}]}
{id: 'bar', resources: [{url: 'http://anotherurl'}]}
```

### get.js

used to download the actual data. stores files in content-addressable format in the folder you specify

example:

```
cat urls.json | node get.js ./data > finished.json 2> progress.json
```

you can also pass an 'exclude list', e.g. the finished.json from a previous log, which will be used to skip already downloaded files if you want to restart a download from where it left off

```
cat urls.json | node get.js ./data ./finished.json > finished2.json 2> progress2.json
```
