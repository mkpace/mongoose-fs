'use strict';

/*!
 * Module dependencies.
 */
var fs = require('fs');
var path = require('path');

/**
 * @module DataAccess
 * @description
 * Data access module performs access to
 * the underlying persistence store - namely
 * the raw file system - again, this is a toy
 * implementation of a basic file based storage system.
 * 
 * ###options:
 * - [path] : String a path to the data files. 
 * 
 * @param {Object} [options] The configuration options
 */
function DataAccess(options) {
  // allow object to be created without the 'new' keyword
  if(!(this instanceof DataAccess)) return new DataAccess();

  // object instances
  options = options || {};
  this.path = options.path || './data';
	this.data = {};
	this.dataLoaded = {};
}

/**
 * @public
 * @function getFilePath
 * @description
 * Get the file path to the data file
 * 
 * @param {String} modelName The name of the model
 * @returns The path to the file.
 */
DataAccess.prototype.getFilePath = function(modelName) {
  // add a forward slash to separate directories
  if(this.path.lastIndexOf('/') !== this.path.length -1) this.path += '/';
	// map the 'model' to a file name [model].data.json
	var filePath = `${this.path}${modelName.toLowerCase()}.data.json`;

	return filePath;	
}

/**
 * @public
 * @function fileExits
 * @description
 * Checks for the existence of the file
 * 
 * @param {String} modelName  The name of the model to check
 * @returns {Boolean}         If the file exists
 */
DataAccess.prototype.fileExists = function (modelName) {
    let exists = false;
    // move up a directory to our data dir
		let filePath = this.getFilePath(modelName);
    
    // check the path and ensure the
    // folder exists before we create a file
    if(!fs.existsSync(this.path)) {
      console.log(`folder doesn't exist ... creating folder: ${this.path}` )
      fs.mkdirSync(this.path);
    };

    return fs.existsSync(filePath);
}

/**
 * @public
 * @function ensureDirExists
 * @description
 * Checks for the existence of the directory
 * 
 * @param {String} modelName  The name of the model to check
 * @returns {Boolean}         If the directory exists
 */
DataAccess.prototype.ensureDirExists = function (path) {
    let exists = false;
    // if we don't have an argument, then use default
    path = path || this.path;
    // check the path and ensure the
    // folder exists before we create a file
    if(!fs.existsSync(this.path)) {
      console.log(`folder doesn't exist ... creating folder: ${this.path}` )
      fs.mkdirSync(this.path);
    };
}

/**
 * @public
 * @function fetchFileData
 * @description
 * Gets the specified model data from the file system.
 * loads the file data into memory and kept in a hashtable
 * by the model name (key).
 * 
 * @param {String}  modelName The model name (file) to retrieve.
 * @returns {Object}          The file data as a json object.
 */
DataAccess.prototype.fetchFileData = function (modelName) {
  // file path template to model
	let filePath = this.getFilePath(modelName);

  if(!this.fileExists(modelName)) {
    // write the new 'empty' file if we don't
    // have any data for the specified model
    // data is stored in hash by model name 
    this.data[modelName] = [];
    console.log(`collection not found ... creating new collection: ${filePath}`);
    // save the data
    this.saveFile(modelName, this.data[modelName]);
  } else {

    // load file data as string
    let fileData = fs.readFileSync(filePath, 'utf8');
    console.log('loaded collection: %s [%d bytes]', modelName, fileData.length); 
    
    // check we have data in the file
    if(fileData.length > 0) {
      // save to hash in memory
      this.data[modelName] = JSON.parse(fileData);
    } else {
      // no data - set to empty array
      this.data[modelName] = [];
    }
  }

  // flag for checking if we've loaded into memory already
  this.dataLoaded[modelName] = true;

  // return the data
  return this.data[modelName];
}

/**
 * @private
 * @description
 * Saves the file to the file system in a
 * default directory named 'data'.
 * 
 * @param {String} modelName  The name of the model - used in the file name.
 * @param {Object} data       The json data to be saved to the file.
 */
DataAccess.prototype.saveFile = function (modelName, data) {
  // set file path to specific data file
	 let filePath = this.getFilePath(modelName);

  // flag for checking if we've loaded into memory already
  this.dataLoaded[modelName] = true;

  // write sync since we don't mind waiting - for now.
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');  
}

module.exports = DataAccess;
