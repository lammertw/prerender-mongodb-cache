var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

var mongoUri = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/prerender';
var mongoTtl = process.env.MONGODB_CACHE_TTL || null;

var database;

MongoClient.connect(mongoUri, function (err, db) {
    database = db;

    if (mongoTtl) {
        database.collection('pages', function (err, collection) {
            collection.indexes(function (err, indexes) {
                var existTtlIndex = false;

                indexes.forEach(function (index) {
                    var isTtlIndex = JSON.stringify(index.key) == JSON.stringify({created: 1});
                    if (isTtlIndex && index.expireAfterSeconds == mongoTtl) {
                        existTtlIndex = true;
                    } else if (isTtlIndex) {
                        collection.dropIndex(index.name);
                    }
                });

                if (!existTtlIndex) {
                    console.log('createIndex');
                    collection.ensureIndex({"created": 1}, {expireAfterSeconds: mongoTtl});
                }
            });
        });
    }
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
            });
        });
    }
};
