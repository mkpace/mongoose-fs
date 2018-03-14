'use strict';

/**
 * Benchmark module
 * @module Benchmark
 * @description
 * Benchmarking module for timing events in node
 * This is a 'toy' implementation - bare bones
 * and doesn't do too much in terms of checking.
 * 
 * @example
 * var benchmark = require('benchmark');
 * benchmark.start();
 * benchmark.stop();
 * console.log(benchmark.elapsed);
 * // displays
 * x.xxxxx ms
 */
module.exports = new Benchmark();

function Benchmark() {
	if(!(this instanceof Benchmark)) return new Benchmark();
	var startTime = 0;
	this.start = startFn;
	this.stop = stopFn;
	/**
	 * @memberof Benchmark
	 * @description
	 * The elapsed time in milliseconds
	 */
	this.elapsed = 0;
}

/**
 * @instance
 * @function start
 * @description
 * Starts the timer
 * 
 */
function startFn() {
	this.startTime = process.hrtime();
}

/**
 * @instance
 * @function stop
 * @description
 * Stops the timer
 */
function stopFn() {
	// get elapsed time
	var elapsedTime = process.hrtime(this.startTime);
	// calculate time in nanoseconds
	var elapsedTime = (((elapsedTime[0] * 1e9 + elapsedTime[1])*1e-9)*1000).toFixed(5);
	this.elapsed = `${elapsedTime} ms`;
}