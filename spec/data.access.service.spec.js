

describe('data.access.service tests', function() {
	var fs = require('fs');
	var DataAccess = require('./../data.access.service');
	var personData = { "_id": "0", "fname": "John", "lname": "Doe" };
	var emptyData = [];
	var da = null;

	beforeEach(function() {
		// here it's being mocked
		spyOn(fs, 'readFileSync').and.returnValue(personData);
	});

  it('can be created as an instance', function(done) {
		da = new DataAccess();
		expect(da.path).toBe('./data');
    done();
  });

  it('can be created without the "new" keyword', function(done) {
		da = DataAccess();
		expect(da.path).toBe('./data');
    done();
  });

  it('has the correct default data path', function(done) {
    da = new DataAccess();
		expect(da.getFilePath('Person')).toBe('./data/person.data.json');
    done();
  });

	it('has the correct custom data path', function(done) {
		da = new DataAccess({
			path: './test'
		});
		expect(da.getFilePath('Person')).toBe('./test/person.data.json');
		done();
	});

	it('has the correct custom data path with a trailing slash "/"', function(done) {
		da = new DataAccess({
			path: './test/'
		});
		expect(da.getFilePath('Person')).toBe('./test/person.data.json');
		done();
  });
  
	it('can save the file the file system using the model name', function(done) {
		da = new DataAccess();
		expect(da.saveFile('Person')).toEqual(emptyData);
		done();
	});  

  it('can create an empty data file on the file system', function(done) {
		da = new DataAccess();
		expect(da.fetchFileData('Person')).toEqual(emptyData);
		done();
	});

	it('can get the empty data file from the file system', function(done) {
		da = new DataAccess();
		expect(da.fetchFileData('Person')).toEqual(emptyData);
		done();
	});

});

