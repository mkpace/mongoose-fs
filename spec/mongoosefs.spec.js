

describe('mongoose-fs tests', () =>{
	var mongoosefs = require('./../mongoose-fs');

	it('should create a new object', function(done) {
		expect(mongoosefs).toBeDefined();
		done();
	});
});