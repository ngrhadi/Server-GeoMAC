const knex = require('knex');
const knexfile = require('./knexfile');


const env = process.env.NODE_ENV || 'development';

console.log('NODE_ENV run on', env)
const configOptions = knexfile[env];
console.log('config connection db :', configOptions)

module.exports = knex(configOptions);
