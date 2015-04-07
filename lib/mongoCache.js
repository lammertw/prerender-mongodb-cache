var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

var mongoUri = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/prerender';

var database;

MongoClient.connect(mongoUri, function(err, db) {
    database = db;
});

var cache_manager = require('cache-manager');

module.exports = {
    init: function() {
        this.cache = cache_manager.caching({
            store: mongo_cache
        });
    },

    beforePhantomRequest: function(req, res, next) {
        if(req.method !== 'GET') {
            return next();
        }

        this.cache.get(req.url, function (err, result) {
            if (!err && result) {
                res.send(200, result);
            } else {
                next();
            }
        });
    },

    afterPhantomRequest: function(req, res, next) {
        this.cache.set(req.url, req.prerender.documentHTML);
        next();
    }
};


var mongo_cache = {
    get: function(key, callback) {
        database.collection('pages', function(err, collection) {
            collection.findOne({key: key}, function (err, item) {
                var value = item ? item.value : null;
                callback(err, value);
            });
        });
    },
    set: function(key, value, callback) {
        database.collection('pages', function(err, collection) {
            var object = {key: key, value: value, created: new Date()};
            collection.update({key: key}, object, {
                upsert: true
            }, function (err) {
                console.error(err);
            });
        });
    }
};
