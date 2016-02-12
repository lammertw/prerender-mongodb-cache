var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

var mongoUri = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/prerender';

var ttl = process.env.CACHE_TTL || 2592000;

var cacheManager = require('cache-manager'),
    mongoStore = require('cache-manager-mongodb'),
    mongoCache;

module.exports = {
    init: function() {
        mongoCache = cacheManager.caching({
            store: mongoStore,
            uri: mongoUri,
            options: {
                collection: "pages",
                compression: false,
                server: {
                    poolSize: 5,
                    auto_reconnect: true
                }
            },
            ttl: ttl
        });
    },

    beforePhantomRequest: function(req, res, next) {

        var currentTTL = req.headers['cache-ttl'] || ttl;

        var url = req.url.replace(/%(25)+/gi, '%').replace(/%3f\_escaped\_fragment.*/gi, '');
        var parts = req.url.split('/'),
            lastPart = parts[parts.length - 1];
        try {
            url = url.replace(lastPart, decodeURIComponent(lastPart).replace(/\?\_escaped\_fragment.*/g, ''));
        } catch (e) {};

        if (req.method !== 'GET') {
            return next();
        }


        try {
            mongoCache.get(url, function(err, result) {
                if (err) {
                    throw err;
                }
                if (!err && result) {
                    res.send(200, result);
                } else {
                    next();
                }
            });
        } catch (e) {
            console.log(e.stack || e.message);
            next();
        }
    },

    afterPhantomRequest: function(req, res, next) {

        var currentTTL = req.headers['cache-ttl'] || ttl;

        var url = req.url.replace(/%(25)+/gi, '%').replace(/%3f\_escaped\_fragment.*/gi, '');
        var parts = req.url.split('/'),
            lastPart = parts[parts.length - 1];
        try {
            url = url.replace(lastPart, decodeURIComponent(lastPart).replace(/\?\_escaped\_fragment.*/g, ''));
        } catch (e) {};

        try {
            mongoCache.set(url, req.prerender.documentHTML, {
                ttl: currentTTL
            }, function(err) {
                if (err) {
                    throw err;
                }
                next();
            });
        } catch (e) {
            console.log(e.stack || e.message);
            next();
        }
    }
};
