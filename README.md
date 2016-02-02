prerender-mongodb-cache
=======================

Prerender plugin for MongoDB caching, to be used with the prerender node application from https://github.com/prerender/prerender. It relys on [cache-manager](https://github.com/BryanDonovan/node-cache-manager) and on the [mongo adapter](https://github.com/v4l3r10/node-cache-manager-mongodb)

How it works
------------

This plugin will store all prerendered pages into a MongoDB instance. There is currently no expiration functionality, which means that once a page is stored, future requests for prerendering a page will always be served from from the database cache if it's available and the page caches are never updated.

To set the cache lifetime use the environment variable when launching prerender: `CACHE_TTL` (in seconds) by default it has been set to one month.

How to use
----------

In your local prerender project run:

    $ npm install prerender-mongodb-cache --save
    
Then in the server.js that initializes the prerender:

```js
server.use(require('prerender-mongodb-cache'));
```

Configuration
-------------

By default it will connect to your MongoDB instance running on localhost and use the *prerender* collection. You can overwrite this by setting the `MONGOLAB_URI` or `MONGOHQ_URL` environment variables to valid MongoDB connection strings.

This is done to make it work automatically when deployed on Heroku with the MongoDB add-ons.
