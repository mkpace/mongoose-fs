
// require module
const DataAccess = require('./lib/data.access.service');

// create a new instance with specific path
const da = new DataAccess({ path: './data/test' });

// create instance with default 'data' path
// const da = DataAccess();

// the filepath for the file
const filePath = da.getFilePath('User');

// fetch the file data
const collection = da.fetchFileData('User');

// output values
console.log('filePath: ', filePath);
console.log('collection:', collection);
