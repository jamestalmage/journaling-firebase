var RewirePlugin = require("rewire-webpack");

module.exports = function(config){
  config.set({
    files: [
      'test/*-test.js',
      'test/**-test.js'
    ],

    browsers:['Chrome'],
    frameworks:['mocha'],

    preprocessors: {
      'test/*-test.js' : ['webpack'],
      'test/**/*-test.js' : ['webpack']
    },

    webpack: {
      plugins: [
        new RewirePlugin()
      ]
    },

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