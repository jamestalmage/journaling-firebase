var utils = require('./utils');
var URI = require('./URI');


function makeRef(store){

  /**
   *
   * @param uri
   * @constructor
   * @class Firebase
   */
  function Firebase(uri){
    this._uri = new URI(uri);
  }

  /**
   * Gets a Firebase reference for the location at the specified relative path.
   *
   * @param {string} childPath A relative path from this location to the desired child location.
   * @returns {Firebase} The `Firebase` reference for the specified child location.
   */
  Firebase.prototype.child = function(childPath){
    return new Firebase(this._uri.child(childPath));
  };

  /**
   * Gets a Firebase reference to the parent location.
   *
   * @returns {Firebase} A Firebase reference to the parent location,
   *                      or null if this instance refers to the root of your Firebase.
   */
  Firebase.prototype.parent = function(){
    var parentUri = this._uri.parent;
    return parentUri === null ? null : new Firebase(parentUri);
  };

  /**
   * Gets a Firebase reference to the root of the Firebase.
   *
   * @returns {Firebase} A Firebase reference to the root of your Firebase.
   */
  Firebase.prototype.root = function(){
    return new Firebase(this._uri.protocol + '//' + this._uri.host);
  };


  /**
   * Returns the last token in a Firebase location.
   *
   * @returns {string} The last token of this location.
   */
  Firebase.prototype.key = function(){
    return this._uri.key;
  };

  /**
   * Returns the last token in a Firebase location.
   *
   * @returns {string} The last token of this location.
   */
  Firebase.prototype.name = function(){
    return this.key();
  };

  /**
   * Gets the absolute URL corresponding to this Firebase reference's location.
   *
   * @returns {string} The absolute URL corresponding to this location.
   */
  Firebase.prototype.toString = function(){
    return this._uri.toString();
  };

  /**
   * Writes data to this Firebase location.
   *
   * @param {Object, string, number, boolean, null} value The value to be written to your Firebase
   *                                                (can be an object, array, string, number, boolean, or null).
   * @param {Function} [onComplete] A callback function that will be called when synchronization to the Firebase
   *                   servers has completed. The callback will be passed an Error object on failure; else null.
   */
  Firebase.prototype.set = function(value,onComplete){
    store.setData(this._uri,new FakeSnapshot(this._uri,value));
  };

  /**
   * Writes the enumerated children to this Firebase location..
   *
   * @param {Object} value An object containing the children and associated values to be written.
   * @param {Function} [onComplete] A callback function that will be called when synchronization to the Firebase
   *                   servers has completed. The callback will be passed an Error object on failure; else null.
   */
  Firebase.prototype.update = function(value,onComplete){};

  /**
   * Removes the data at this Firebase location..
   *
   * @param {Function} [onComplete] A callback function that will be called when synchronization to the Firebase
   *                   servers has completed. The callback will be passed an Error object on failure; else null.
   */
  Firebase.prototype.remove = function(onComplete){};

  /**
   * Generates a new child location using a unique key and returns a Firebase reference to it.
   *
   * @param {Object, string, number, boolean, null} value The value to be written at the generated location
   *                                                (can be an object, array, string, number, boolean, or null).
   * @param {Function} [onComplete] A callback function that will be called when synchronization to the Firebase
   *                   servers has completed. The callback will be passed an Error object on failure; else null.
   * @returns {Firebase} A Firebase reference for the generated location.
   */
  Firebase.prototype.push = function(value,onComplete){};

  /**
   * Writes data to this Firebase location. Like set() but also specifies the priority for that data.
   *
   * @param {Object, string, number, boolean, null} value The value to be written to the Firebase location
   *                                                (can be an object, array, string, number, boolean, or null).
   * @param {string, number} priority The priority (as a string or number) for the data being written.
   * @param {Function} [onComplete] A callback function that will be called when synchronization to the Firebase
   *                   servers has completed. The callback will be passed an Error object on failure; else null.
   */
  Firebase.prototype.setWithPriority = function(value,priority,onComplete){};

  /**
   * Sets a priority for the data at this Firebase location.
   *
   * @param {string, number} priority The priority for the data at this location (as a number or string).
   * @param {Function} [onComplete] A callback function that will be called when synchronization to the Firebase
   *                   servers has completed. The callback will be passed an Error object on failure; else null.
   */
  Firebase.prototype.setPriority = function(){};

  return Firebase;
}

module.exports = makeRef;
