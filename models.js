const sequelize = require('./db')
const {DataTypes} = require('sequelize')

// const AuthUsersIdList = sequelize.define('authUsersIdList', {
//     authUsersIdList: {type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: []},
// })

// allRequests: {type: DataTypes.INTEGER, defaultValue: 0},
// timeToRefresh: {type: DataTypes.INTEGER, defaultValue: 0},
// accessToken: {type: DataTypes.STRING, defaultValue: ''},
// status: {type: DataTypes.STRING, defaultValue: ''},

const ListUsers = sequelize.define('ListUsers', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    chatId: {type: DataTypes.INTEGER, unique: true},
    checks: {type: DataTypes.INTEGER, defaultValue: 0}
}, {
    timestamps: false
})

module.exports = ListUsers;
