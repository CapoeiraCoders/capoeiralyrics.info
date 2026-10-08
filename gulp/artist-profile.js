/* jshint node:true, esversion:6 */
const path = require('path');
const createProfileLoader = require('./json-profile');

module.exports = createProfileLoader(path.join(__dirname, '../data/artists.json'));
