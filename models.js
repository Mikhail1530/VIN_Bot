const sequelize = require('./db')
const {DataTypes} = require('sequelize')


const ListUsers = sequelize.define('ListUsers', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    chatId: {type: DataTypes.BIGINT, unique: true},
    userName: {type: DataTypes.STRING, defaultValue: ''},
    checks: {type: DataTypes.INTEGER, defaultValue: 0},
}, {
    timestamps: false
})
const Vars = sequelize.define('Vars', {
    id: {type: DataTypes.INTEGER, primaryKey: true, defaultValue: 555},
    status: {type: DataTypes.STRING, defaultValue: ''},
    date: {type: DataTypes.INTEGER, defaultValue: 0},
    accessToken: {type: DataTypes.STRING(1234), defaultValue: ''},
}, {
    timestamps: false
})

module.exports = {ListUsers, Vars}
