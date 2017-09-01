var kue = require('kue');
var queue = kue.createQueue();
var MongoClient = require('mongodb').MongoClient;
var _ = require('underscore');
var twit = require('twit');
var async = require('async');
var BigNumber = require('big-number');
var moment = require('moment');

var MONGODB_URL = process.env['ERRAND_MONGODB_URL'] ? process.env['ERRAND_MONGODB_URL'] : "mongodb://localhost:27017";

var twitter = new twit({
  consumer_key: process.env['ERRAND_TWITTER_CONSUMER_KEY'],
  consumer_secret: process.env['ERRAND_TWITTER_CONSUMER_SECRET'],
  access_token: process.env['ERRAND_TWITTER_ACCESS_TOKEN'],
  access_token_secret:  process.env['ERRAND_TWITTER_ACCESS_TOKEN_SECRET']
});

function graceful() {
  process.exit(0);
}

process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);

queue.process('errand-twitter', function(job, done){

  MongoClient.connect( MONGODB_URL + "/" + job.data.request.database, function(err, db) {

    var complete = false;
    var complete_previous = false;
    var lastresult = '';
    var sinceset = false;
    var previous_since_id ='';
    var count=0;
    var result_previous=[];
    var result_current=[];

    async.series([
      function(callback_sinceget) {
        db.collection(job.data.request.past).find({"query": job.data.request.parameters.q, "method": job.data.request.method }).toArray(function(err, documents) {
          var MONGODB_URL = process.env['ERRAND_MONGODB_URL'] ? process.env['ERRAND_MONGODB_URL'] : "mongodb://localhost:27017";

          previous_since_id = documents.length ? documents[0].since_id : '';
          callback_sinceget();
        },
        function(err){
          console.log(err);
          callback_sinceget();
        });
      },
      function(callback_sinceusing) {

        async.whilst(
          function () { return ( ( complete != true ) && ( complete_previous !=true ) ); },
          function (callback_twitter) {

            twitter.get('search/tweets', job.data.request.parameters,  function (err, result) {

              async.eachSeries(result.statuses, function(status, callback_mongodb) {

                result_current = _.pluck(result.statuses,'id_str');

                async.series([
                  function(callback_sinceset) {

                    if (sinceset == false) {

                      db.collection(job.data.request.past).updateOne(
                        { "query": job.data.request.parameters.q },
                        { "$set": {
                          "since_id": status.id_str,
                          "method": job.data.request.method
                        }},
                        {upsert:true},
                        function(err, query) {
                          sinceset=true;
                          callback_sinceset();
                        });
                      }
                    else {
                      callback_sinceset();
                    }

                  },
                  function(callback_mongodb_insert) {

                    status.created_at = (typeof status.created_at === "undefined" ? '': new Date(moment(status.created_at, "ddd MMM DD HH:mm:ss ZZ YYYY")));
                    status.user.created_at = (typeof status.user.created_at === "undefined" ? '': new Date(moment(status.user.created_at, "ddd MMM DD HH:mm:ss ZZ YYYY")));

                    count++;

                    db.collection(job.data.request.collection).insertOne( status, function(err, document) {
                      job.data.request.parameters.max_id=status.id_str;
                      if ( BigNumber(lastresult).equals(status.id_str) ) { complete = true; } else { complete = false; }
                      if ( ( previous_since_id != '' ) && ( BigNumber(previous_since_id).lte(status.id_str) ) ) { complete_previous = true; }
                      lastresult=status.id_str;
                      callback_mongodb();
                    });

                  }
                ]);

              }, function(err) {
                if(err) {
                  console.log("There was an error" + err);
                }

                if (result_current.sort().join(',') === result_previous.sort().join(',')) { complete = true;}
                result_previous = result_current;
                complete = (typeof result === "undefined" ? true : complete);
                setTimeout(callback_twitter, 3000);
              });

            });
          },
          function (err) {
            console.log('for query = ',job.data.request.parameters.q,' fetched ',count);
            db.close();
            done();
          }
        );

      }
    ]);

  });

});
