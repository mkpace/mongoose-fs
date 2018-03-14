'use strict';

/**
 * Module dependencies.
 */
const path = require('path');
const mongooseFs = require('./../lib/mongoose-fs');

const User = mongooseFs.model('User');

/**
 * Example controller using Express.js
 * as middleware to manage documents
 * using the MongooseFs DB provider.
 * The MongooseFs provider can be swapped out
 * simply by replacing the require with 'mongoose'.
 */

/**
 * Create a new user
 * @param {Object} req  http request 
 * @param {Object} res  http response
 */
exports.create = function(req, res) {
    const user = new User(req.body);
    alarm.save( err => {
        if (err) throw new Error('error saving alarm trap object');
        res.json(user);
      });
};

/**
 * Delete all users with fname
 * @param {Object} req  http request 
 * @param {Object} res  http response
 */
exports.delete = function(req, res) {
    Alarm.deleteMany( { fname: req.params.fname }, (err, result) => {
        res.json(result);
    });
}

/**
 * Get all users
 * @param {Object} req  http request 
 * @param {Object} res  http response
 */
exports.list = function (req, res){
    User.find( (err, items) => {
        res.json(items);
    });
};

/**
 * Get the user by the specified id
 * @param {Object} req  http request 
 * @param {Object} res  http response
 */
exports.read = function (req, res) {
    User.findOne({ _id: req.params._id }).exec((err, items) => {
        res.json(items);
    });
}

/**
 * Update the specified user
 * @param {Object} req  http request 
 * @param {Object} res  http response
 */
exports.update = (req, res) => {
  User.findOneAndUpdate({ _id: req.body._id }, (err, item) => {
    if (err) return res.status(400).send({ message: err });
    else res.json(item);
  });
}