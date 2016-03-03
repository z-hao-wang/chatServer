var DBConfig = require('./mongodb.js');
var Config = {
    expireDuration: 8640000,
    DB: DBConfig
};
module.exports = Config;
