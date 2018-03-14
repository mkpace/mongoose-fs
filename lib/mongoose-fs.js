'use strict';

/**
 * @ignore
 * Module dependencies
 */
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const importSheet = require('./import-xlsx');
const uuidV4 = require('uuid/v4');
const benchmark = require('./lib/benchmark');

var documents = {};

module.exports = new MongooseFs;
/**
 * MongooseFs module
 * @module MongooseFs
 * @description
 * A toy implementation of MongooseJS
 * the object modeling library for MongoDB. 
 * This implementation uses the file system as 
 * the backing store rather than a MongoDB database.
 * 
 * This implementation uses the same syntax
 * as MongooseJS but only supports a small subset
 * of commands (CRUD). To use this module, you can
 * refer to this documentation or MongooseJS for
 * performing the following tasks.
 * - Creating a Schema
 * - Retrieving Models
 * - Finding documents
 * - Saving documents
 * - Updating documents
 * - Deleteing documents.
 */
function MongooseFs() {
  if (!(this instanceof MongooseFs)) return new MongooseFs();
  // local variables
  var data = {};
  this.modelCount = 0;
  // TODO: rename 'collection'
  this.documents = {};
  this.schemas = {};
  this.models = {};
  this.reset = resetFn;
  this.set = setFn;
  this.connect = connectFn;
  this.model = modelFn;
  this.Schema = schemaFn;
};

/**
 * @private
 * @description
 * Binds properties to the object (this)
 * Used by static 'save' to return an object that
 * can be serialized into a POJO to return
 * to the client in the response.
 * 
 * @param {Object} data The object data
 */
function bindPropertiesFn (data) {
  Object.keys(data).forEach((key) => {
    if(key !== 'methods' && key !== 'statics' && key !== 'pre' && key !== 'preHook') {
      this[key] = data[key];
    }
  });
}



/**
 * @instance
 * @function connect
 * @description
 * Loads all the models (files) from the backing store.
 * The file system in this case.
 * This function emulates a connection to MongoDB 
 * and uses the same signature as Mongoose.
 * 
 * @param {any} dbUri Does nothing for now - should create a service point
 * @param {any} options Does nothing
 * @param {Function} callback A callback
 */
function connectFn(dbUri, options, callback) {
  loadModelsFn.call(this);
  if(callback) callback();
  return;
}

/**
 * @static
 * @function deleteMany
 * @description
 * Remove all documents that meet the query criteria
 * Currently only supports a single property and value
 * 
 * @param {Object} query A query in the form of an object e.g. { serialNo: '1212' }
 * @param {Function} callback 
 */
function deleteManyFn(query, callback) {
  let err = null;
  let itemCount = 0;
  let property;
  let value;

  if(arguments.length === 0) {
    throw Error('A Query object and Callback function are required');
  } else {
    // we have a query e.g. { serialNo: '123123' }
    if (Object.entries) {
      [property, value] = Object.entries(query)[0];
    } else {
      property = Object.keys(query)[0];
      value = query[property];
    }
  }
  
  documents[this.name] = documents[this.name].filter( document => {
    // remove the items we are filtering out
    if(document[property] !== value) {
      return true;
    }
    itemCount++;
    return false;
  });

  if(itemCount === 0) err.message = `${this.name}.${property} === ${value} not found.`;

  let instance = Object.create(this.prototype);  
  
  // write sync since we don't mind waiting - for now.
  instance.saveFile(this.name, documents[this.name]);

  // fire user supplied callback - no error (null)   
  callback(err, { acknowledged: true, deletedCount: itemCount });
}

/**
 * @description
 * Emulates the same function in Mongoose.
 * Dumps all the documents from memory.
 * 
 * @param {any} callback 
 */
function disconnect(callback) {

  // walk through all the schemas we have registered
  Object.keys(documents).sort().forEach((key) => {
    // remove all documents from the collection
    documents[key].length = 0;
  });

  if(callback) callback(null);
}

/**
 * @static
 * @function exec
 * @description
 *  Used to execute a query
 *  TODO: finish this implementation
 * 
 * @param {Object} item 
 */
function execFn(item) {
  return function (callback) {
    if(callback === null) throw Error('Callback required');
    var err = null;
    callback(err, item);
  };
}

/**
 * @static
 * @function find
 * @description
 * Finds and returns the object specified
 * in the query or if none specifiec, returns all items
 * 
 * @param {Function} callback the callback function
 */
function findFn(query, callback) {
  let err = null;
  let docs = null;
  if(arguments.length > 1) {
    // doesn't work for more than one key
    Object.keys(query).forEach((key) => {
      docs = documents[this.name].filter( item => {
        return item[key] === query[key];      
      });
    });  
  } else {
    // only 1 arg - set callback
    callback = query;
    docs = documents[this.name];
  }
  
  if(callback === null) throw Error('Callback required');
  if (callback) callback(err, docs);
  let instance = Object.create(this.prototype);  
  return {
    remove: removeFn.bind(instance)
  }
}

/**
 * @static
 * @function findOne
 * @description
 *  Uses the query object to find the first
 *  matching document and returns that document.
 * 
 * @param {Object} query  A query object
 * @param {Function} callback 
 */
function findOneFn(query, callback) {
  let self = this;
  let err = null;
  let doc = null;
  let obj = null;
  let docs = documents[this.name];

  let instance = Object.create(this.prototype);
  if(query) {
    Object.keys(query).forEach((key) => {
      doc = docs.find((item) => {
        return item[key] === query[key];
      });
    });  
    // if we have data create a new instance
    // so the return object has all the
    // instance methods assigned in the model.
    if(doc) obj = new this(doc);
    else err = 'No document found';
  } else {
    err = 'No query specified';
  }


  if (callback){ callback(err, obj); }
  else return {
    remove: removeOneFn.call(self, doc),
    exec: execFn(doc) 
  }
}

/**
 * @private
 * @description
 * Reads in the data from the file if 
 * the data in memory hasn't been initialized.
 */
function loadModelsFn() {
  var self = this;
  console.log('Initialize DB: Loading Collections');
  benchmark.start();
  // walk through all the schemas we have registered
    Object.keys(self.schemas).sort().forEach((key) => {
    // load the models from the file system
    documents[key] = self.fetchFileData(key);
  });
  benchmark.stop();
  console.log('Collections loaded in: ', benchmark.elapsed);
}

/**
 * @instance
 * @function model
 * @description
 * Either creates a new schema if supplied
 * or will return the model if only 1 argument passed.
 * 
 * @example
 * // creates a new 'Contact' class
 * var Contact = mongoose-fs.model('Contact', contactSchema);
 * @param {string} name   The name of the model
 * @param {Object} schema A schema object
 * @returns {Object}      A new 'class' of the same name supplied in the name argument
 */
function modelFn(name, schema) {
  var self = this;
  if(arguments.length === 1) {
    if(this.schemas[name] !== undefined && this.models[name] === undefined) { 
      this.models[name] = modelCreatorFn(self, name);
      return this.models[name];
    } else {
      return this.models[name];
      // throw Error(`Schema ${name} not defined.`)
    }
  } else if(arguments.length === 2) {
    this.schemas[name] = schema;
  }
  this.modelCount++;
  return {
    name: name,
    schema: schema
  }
}

/**
 * @private
 * @description
 * Dynamic schema creator to emulate
 * the mongoose driver API for MongoDB.
 * Mongoose uses an unusual pattern when
 * finding, saving, and deleting items
 * from MongoDB. This function emulates the
 * same behaviour as the 'native' mongoose driver,
 * but it persist to the file system, rather than a DB.
 * 'Static' methods are bound directly to the object
 * while 'Instance' methods are created using prototype.
 * 
 * @param {String}  name The name of the function to create.
 * @returns {Object} A new object with that name.
 */
function modelCreatorFn(self, name) {
  // dynamically create a 'base' class
  var fn = new Function(`return function ${name}(data){ this.bindData(data); }`)();
  // add methods to class
  fn.prototype.modelName = name;
  fn.prototype.remove = removeFn;
  fn.prototype.save = saveFn;
  fn.prototype.schema = self.schemas[name];
  fn.prototype.update = updateFn;
  fn.prototype.bindData = bindPropertiesFn;
  fn.prototype.saveFile = self.saveFile;

  // check for methods functions if we 
  // have any, add them to the object
  // prototype so they can be called
  // on the mongoose model instance.
  if(self.schemas[name].methods) {
    // enumerate the keys
    Object.keys(self.schemas[name].methods).forEach( key => {
      // only add the functions
      if(typeof(self.schemas[name].methods[key]) === 'function') {
        fn.prototype[key] = self.schemas[name].methods[key];
      }
    });
  }

  // check if schema has any defined pre-hooks
  if(self.schemas[name].pre) {
    // create the dictionary to hold the hooks
    fn.prototype.preHook = {};
    // add the hook name and function handler
    Object.keys(self.schemas[name].preHook).forEach( key => {
      fn.prototype.preHook[key] = self.schemas[name].preHook[key];
    });
  }

  // add 'static' type methods
  fn.deleteMany = deleteManyFn;
  fn.reset = removeAllFn;
  fn.find = findFn;
  fn.findOne = findOneFn;

  // check for statics functions if we 
  // have any, add them to the object
  // so they can be called statically
  // on the mongoose model object.
  if(self.schemas[name].statics) {
    // enumerate the keys
    Object.keys(self.schemas[name].statics).forEach( key => {
      // only add the functions
      if(typeof(self.schemas[name].methods[key]) === 'function') {
        fn[key] = self.schemas[name].statics[key];
      }
    });
  }

  return fn;
}

/**
 * @instance
 * @function reset
 * @description
 * Deletes all records from the persisted store.
 * This function should be called when you want
 * to clear the entire 'db'
 */
function removeAllFn(callback) {
  if(callback === null) throw Error('Callback required');
  var err = null;
  var numAffected = 0;

  // remove the item
  numAffected = document[this.modelName].length;
  // reset the array to -0-
  document[this.modelName].length = 0;
  // write sync since we don't mind waiting - for now.
  this.saveFile(this.modelName, document[this.modelName]);
  // fire user supplied callback - no error (null)   
  callback(err, document[this.modelName], numAffected);
};

/**
 * @instance
 * @function remove
 * @description
 * Deletes all matching documents from the collection
 * 
 * @param {Object} query A query object to match the document
 * @param {Function} callback Callback arguments (err, item, numAffected)
 */
function removeFn(query, callback) {
  let self = this;
  let err = null;
  let itemCount = 0;
  let property = '_id';
  let value = self[property];

  if(arguments.length === 0) {
    throw Error('Callback required');
  } else if(arguments.length === 1) {
    // only one arg should be the callback
    callback = query;
  } else if(arguments.length === 2) {
    // we have a query e.g. { name: 'Joe' }
    [property, value] = Object.entries(query)[0];
  }
  
  documents[this.modelName] = documents[this.modelName].filter( document => {
    // remove the items we are filtering out
    if(document[property] !== value) {
      itemCount++;
      return document;
    }
  });

  if(itemCount === 0) err.message = `Item ${this._id} not found.`;

  // write sync since we don't mind waiting - for now.
  this.saveFile(this.modelName, documents[this.modelName]);

  // fire user supplied callback - no error (null)   
  callback(err, { acknowledged: true, deletedCount: itemCount });
}

/**
 * @instance
 * @function remove
 * @description
 * Deletes a document from the collection
 * This function is chained from findOne
 * 
 * @param {Object} doc Document object to be removed.
 */
function removeOneFn(doc) {
  let self = this;
  // get an instance of this object
  let instance = Object.create(this.prototype);
  // bind the object query property/values
  instance.bindData(doc);

  return function(callback) {

    let err = null;
    let item = null;

    if(callback === null) throw Error('Callback required');
      
    // we have an id - update this item
    let index = documents[self.name].findIndex( item => {
      // found the item index
      return ( item._id === instance._id );
    });
    if(index > -1) {
      // remove the item
      item = documents[self.name].splice(index,1);
      if(item.length === 0) err.message = `Item ${this._id} not found.`;

      // write sync since we don't mind waiting - for now.
      instance.saveFile(self.name, documents[self.name]);
    } else {
      err = {message: `Item ${instance._id} not found.` };
    }

    // fire user supplied callback - no error (null)   
    callback(err, item[0]);

  }
}

/**
 * @instance
 * @function reset
 * @description
 * Deletes all documents from all collections
 * This function is destructive and non-recoverable.
 * 
 */
function resetFn(callback) { 
  try {
    Object.keys(documents).forEach( (key) => {
      documents[key].length = 0;
      this.saveFile(key, documents[key]);
    });
    callback( null, {status: 'deleted'});
  } catch(e) {
    callback( {status: `error: ${e}`}, null);
  }
}

/**
 * @instance
 * @function save
 * @description
 * Saves the document to the collection
 * and persists the file to the filesystem
 * @example
 * // saves a new contact
 * var contact = new Contact(req.body);
 * contact.save((err) => { ... });
 * @param {Function} callback the callback function
 */
function saveFn(callback) {
  
  if(callback === null) throw Error('Callback required');

  // check for the pre-save hook
  if(this.preHook.save) {
    
    // call the pre-save hook to modify the data
    this.preHook.save.call(this, _ => {
      saveDataFn.call(this, callback);
    });

  } else {
    saveDataFn.call(this, callback);
  }
}

/**
 * @private
 * @description
 * Called by saveFn which includes the pre-hook
 * function shim option. This is added to handle
 * either case with or without the pre-hook handler.
 * 
 * @param {Function} callback 
 */
function saveDataFn(callback) {
  let err = null;
  let numAffected = 0;
  let validObject = null;
  let updatedItem = null;
  let newObject = null;
   
  validObject = validateSchemaFn(this.schema, this);
  this.bindData(validObject);

  // perform operations on the data
  // after it has been modified by the pre-save hook
  documents[this.modelName] = documents[this.modelName].map((item) => {
    if(item._id === validObject._id) {
      numAffected++;
      // found the item - replace it
      return item = validObject;
    } else {
      return item = item;
    }
  });

  // if we didn't find an object to 
  // replace then we should add it to the document (collection)
  if(numAffected === 0) {
    documents[this.modelName].push(validObject);
  }

  this.saveFile(this.modelName, documents[this.modelName]);
  // fire user supplied callback - no error (null)
  callback(err, validObject, numAffected);
}

/**
 * @constructor
 * @function Schema
 * @description
 * Creates a new schema given a configuration object
 * @example
 * // creates a new schema
 * var Schema = mongoose-fs.Schema;
 * var contactSchema = new Schema({ 
 *  fname: String, 
 *  lname: String
 * });
 * @param {Object} config An object literal defining the object schema
 */
function schemaFn(config) {
  // set a static function on the 'class'
  config.statics = {};
  // object to hold references to pre-hook fn's
  config.preHook = {};
  // set instance methods on the object
  config.methods = {};
  // TODO: add pre-handler before calling fnName (function name)
  config.pre = (fnName, handler) => {
    config.preHook[fnName] = handler;
  };  
  return config;
}

/**
 * @description
 * Mimics Mongoose set 
 * TODO: enable more verbose output
 * @param {String} property 
 * @param {Boolean} value 
 */
function setFn(property, value) {
  if(property === 'debug' && value === true) {
    // enable debugging
  }
}

/**
 * @instance
 * @function update
 * @description
 * Updates the document in the collection
 * and persists the file to the filesystem
 * @example
 * // updates the document with the newly specified one
 * var contact = new Contact(req.body);
 * contact.update((err) => { ... });
 * @param {Function} callback the callback function
 */
function updateFn(callback) {
  
  if(callback === null) throw Error('Callback required');
  if(this._id === undefined) throw Error('Item _id required');
  let err = null;
  let numAffected = 0;
  let validObject = null;
  let updatedItem = null;
  let newObject = null;

  validObject = validateSchemaFn(this.schema, this);

  // we have an id - update this item
  documents[this.modelName] = documents[this.modelName].map((item) => {
    if(item._id === validObject._id) {
      numAffected++;
      // found the item - replace it
      return item = validObject;
    } else {
      return item = item;
    }
  });

  this.saveFile(this.modelName, documents[this.modelName]);
  // fire user supplied callback - no error (null)   
  callback(err, validObject, numAffected);
}

/**
 * @private
 * @description
 * Schema validation function to force supplied
 * data object (from http request body) to conform
 * to the specified schema for the object type.
 * Non-conforming properties will be excluded and
 * a unique id will be created for each document if one
 * does not currently exist.
 * 
 * @param {Object} schema The document schema
 * @param {Object} data   The supplied document data
 * @returns {Object}      A 'valid' document that conforms to the specified schema
 */
function validateSchemaFn(schema, data) {
  var validObject = {};
  Object.keys(schema).forEach( (key) => {
    // skip these mongoose object types
    if(key !== 'methods' && key !== 'statics' && key !== 'pre' && key !== 'preHook') {

      if(typeof schema[key] === 'function') {
        // only 'type' is defined
        validObject[key] = getSchemaTypeValue(schema, key, data)

        // we may have an object defined { type: String, default: '' }
      } else if(typeof schema[key] === 'object') {

        // multiple schema attributes defined
        // check type
        if(schema[key].type){
          validObject[key] = getSchemaTypeValue(schema, key, data);
          // check default
          if(schema[key].default) {
            if(typeof schema[key].default === 'function') {
              validObject[key] = schema[key].default.call(null);
            } else {
              validObject[key] = schema[key].default;
            }
          }
        } else {
          validObject[key] = getSchemaTypeValue(schema, key, data);
        }
      }
      if(data._id === undefined) {
        // save this as a new item
        // create a new id for this item
        validObject._id = uuidV4();
      } else {
        validObject._id = data._id;
      }
    }
  });
  return validObject;
}

/**
 * @private
 * @description
 * Parses the schema and supplied document object
 * to filter the document object properties to coerce
 * the property value to the correct data type.
 * 
 * @param {Object} schema The schema object
 * @param {String} key    The property name (object key)
 * @param {Object} data   The property data to coerce
 */
function getSchemaTypeValue(schema, key, data) {
  let value;
  let type;
  // check if type is not 
  if(typeof schema[key].type === 'function') {
    type = schema[key].type.name;  
  } else {
    type = schema[key].name;
  }
  switch(type) {
    case 'Array':
    case 'Object':
    case 'String':
      // trim if specified
      if(schema[key].trim) value = data[key].trim();
      // lowercase the string
      if(schema[key].lowercase) value = data[key].toLowerCase();
      else value = data[key];
      break;
    case 'Number':
      value = parseInt(data[key]);
      break;
    case 'Boolean':
      value = Boolean(data[key]);
      break;
  }
  return value;
}

// FILE SERVICES

/**
 * @private
 * @description
 * Checks for the existence of the file
 * 
 * @param {String} modelName  The name of the model to check
 * @returns {Boolean}         If the file exists
 */
function checkFileExistsFn(modelName) {
    // map the 'model' to a file name [model].data.json
    let file = `./data/${modelName.toLowerCase()}.data.json`;
    // move up a directory to our data dir
    let filePath = path.join(__dirname, '/../', file);
  
    return fs.existsSync(filePath);
}

/**
 * @private
 * @description
 * Gets the specified model data from the file system.
 * loads the file data into memory and kept in a hashtable
 * by the model name (key).
 * 
 * @param {String}  modelName The model name (file) to retrieve.
 * @returns {Object}          The file data as a json object.
 */
MongooseFs.prototype.fetchFileData = function fetchFileDataFn(modelName) {
  // file path template to model
  let filePath = `./data/${modelName.toLowerCase()}.data.json`;

  if(!checkFileExistsFn(modelName)) {
    // write the new 'empty' file if we don't
    // have any data for the specified model
    // data is stored in hash by model name 
    this.documents[modelName] = [];
    console.log(`collection not found ... creating new collection: ${modelName}`);
    // save the data
    this.saveFile(modelName, this.documents[modelName]);
  } else {

    // load file data as string
    let fileData = fs.readFileSync(filePath, 'utf8');
    console.log('loaded collection: %s [%d bytes]', modelName, fileData.length); 
    
    // check we have data in the file
    if(fileData.length > 0) {
      // save to hash in memory
      this.documents[modelName] = JSON.parse(fileData);
    } else {
      // no data - set to empty array
      this.documents[modelName] = [];
    }
  }

  // flag for checking if we've loaded into memory already
  // dataLoaded[modelName] = true;

  // return the data - not really necessary
  return this.documents[modelName];
}

/**
 * @private
 * @description
 * Saves the file to the file system in a
 * directory called 'data'.
 * 
 * @param {String} modelName  The name of the model - used in the file name.
 * @param {Object} data       The json data to be saved to the file.
 */
MongooseFs.prototype.saveFile = function saveFileFn(modelName, data) {
  // set file path to specific data file
   let filePath = `./data/${modelName.toLowerCase()}.data.json`;

        // check if directory exists first
        if(!fs.existsSync('./data')) {
            // create the directory since we don't have one
            fs.mkdirSync('./data');
        }

  // write sync since we don't mind waiting - for now.
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');  
}

// END FILE SERVICES


