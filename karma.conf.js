var RewirePlugin = require("rewire-webpack");

var webpackConfig = require('./webpack.conf')();
webpackConfig.plugins = [
  new RewirePlugin()
];

module.exports = function(config){
  config.set({
    files: [
      'bower_components/firebase/firebase-debug.js',
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

    reporters: ['mocha']

    //plugins: [
    //  require('karma-webpack')
   // ]
  })
};