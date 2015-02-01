var RewirePlugin = require("rewire-webpack");

var webpackConfig = require('./webpack.conf')();
webpackConfig.plugins = [
  new RewirePlugin()
];

module.exports = function(config){
  config.set({
    files: [
      'bower_components/firebase/firebase-debug.js',
      'node_modules/sinon/pkg/sinon.js',
      'test/*-test.js',
      'test/**-test.js'
    ],

    browsers:['Chrome'],
    frameworks:['mocha'],

    preprocessors: {
      'test/*-test.js' : ['webpack'],
      'test/**/*-test.js' : ['webpack']
    },

    webpack: webpackConfig,

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      noInfo: true
    },

    reporters: ['mocha'],

    logLevel:'LOG_DEBUG',

    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-chrome-launcher'),
      require('karma-mocha-reporter')
    ]
  })
};