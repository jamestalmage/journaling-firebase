var path = require('path');

module.exports = function(){
  return {
    contentBase: "/example",
    entry: {
      //app: ['webpack/hot/dev-server', './index.js']
      app: ['./index.js']
    },
    output:{
      path: path.join(__dirname, "example"),
      filename: 'bundle.js',
      // export itself to a global var
      libraryTarget: "var",
      // name of the global var: "Foo"
      library: "JournalingFirebase",
    },
    externals: {
      firebase: 'Firebase',
      sinon:'sinon'/*,
       mockfirebase: 'MockFirebase'   */
    }
  };
}