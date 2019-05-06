const AWS = require('aws-sdk');
const es = require('event-stream')
const {
   PassThrough
} = require('stream')

const s3select = (keys, options, s3) => {
   let currentkey = 0
   return function(count, cb) {
      if (currentkey === keys.length) {
         return this.emit('end')
      }
      const selectObjectContent = (cb) => {
         const copy = JSON.parse(JSON.stringify(options));
         copy.Key = keys[currentkey];
         s3.selectObjectContent(
            copy,
            (err, data) => {
               if (err) {
                  return cb(err)
               }
               data.Payload
                  .on('data', (event) => {
                     if (event.Records) {
                        this.emit('data', event.Records.Payload)
                     }
                  })
                  .on('error', cb)
                  .on('end', () => {
                     currentkey++
                     cb()
                  })
            })
      }
      selectObjectContent(cb)
   }
}

exports = module.exports = function(
   keys,
   options,
   s3opts,
   sharedIniFileCredentials) {
   // You could do AWS.SharedIniFileCredentials outside of this class
   // and it would do the same thing. Just making it easy here.

   // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html
   if (sharedIniFileCredentials) {
      AWS.SharedIniFileCredentials(sharedIniFileCredentials)
   }
   // We pipe through a PassThrough stream because of this issue.
   // https://github.com/aws/aws-sdk-js/issues/1761
   // Seems like the es.readable doesn't support read().
   return es.readable(
         s3select(keys, options, new AWS.S3(s3opts || {})))
      .pipe(new PassThrough())
}