#!/usr/bin/env node

const {
   performance
} = require('perf_hooks');
performance.mark('A')

const AWS = require('aws-sdk');
const fs = require('fs')
const s3stream = require('./')
const {
   PassThrough
} = require('stream')
const zlib = require('zlib');

const bucket = process.env.S3_SELECT_BUCKET
const keys = fs.readFileSync(process.env.S3_SELECT_KEYS).toString().split('\n')
keys.splice(15)

const hostname = '10.160.2.12'
const options = {
   Bucket: bucket,
   Expression: `select * from s3object s where s.rawmsghostname='${hostname}'`,
   ExpressionType: 'SQL',
   InputSerialization: {
      JSON: {
         Type: 'LINES'
      },
      CompressionType: 'GZIP'
   },
   OutputSerialization: {
      JSON: {
         RecordDelimiter: '\n'
      }
   }
}

new AWS.S3().upload({
   Bucket: bucket,
   Key: 'TTT',
   Body: s3stream(keys, options).pipe(zlib.createGzip())
}, (err, data) => {
   performance.mark('B')
   performance.measure('A to B', 'A', 'B')
   console.error(err, data, performance.getEntriesByName('A to B'))
});