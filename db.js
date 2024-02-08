const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
    'vinBotDB',
    'admin',
    'mandarin',
    {
        host: 'master.bd26cf5f-de8d-4bcd-b419-3c1bf6f999b4.c.dbaas.selcloud.ru',
        port: '5432',
        dialect: 'postgres'
    }
)