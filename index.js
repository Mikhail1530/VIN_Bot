const TelegramApi = require('node-telegram-bot-api')
const axios = require('axios')
const token = '6841869139:AAGsQ-6C3FJxfVPdfJko7Sa2evA0Hyz5Yy4'
const bot = new TelegramApi(token, {polling: true})
const fsPromises = require('fs').promises
const sequelize = require('./db')
const ListUsers = require('./models')

const instance = axios.create({
    baseURL: "https://www.clearvin.com/rest/vendor/",
});
let authUsersIdList = []
let allRequests = 0
let timeToRefresh = 0
let accessToken = ''
let status = ''

let listUsersUsed = {}

const KEYBOARD = {
    reply_markup: JSON.stringify({
        keyboard: [
            ['🆔 id', '💬 info'],
            ['➕ add_user', '🪒 delete_user'],
            ['✅ VIN'],
        ],
        resize_keyboard: true
    })
}
const start = async () => {

    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch (e) {
        console.log('Connect data failed', e)
    }


    await bot.setMyCommands([
        {command: '/start', description: 'Запустить бота'},
        {command: '/id', description: 'Узнать свой ID'},
    ])
    bot.onText(/(.+)/, async (msg, match) => {
            const first_name = msg.from.first_name
            const chatId = msg.chat.id


            try {
                if (match[0] === '🆔 id' && await authenticate_users(chatId)) {
                    try {
                        const user = await ListUsers.findOne({chatId})
                        return bot.sendMessage(chatId, `${first_name}. Ваш ID: ${user.chatId}`)
                    } catch (e) {
                        return bot.sendMessage(chatId, 'Нибумбум')
                    }
                }
                if (match[0] === '✅ VIN' && await authenticate_users(chatId)) {
                    await bot.sendMessage(chatId, 'Введите VIN авто (17 символов)')
                }

                if (match[0].length === 17 && await authenticate_users(chatId)) {
                    const url = `report?vin=${msg.text}&format=pdf&reportTemplate=2021`
                    let timeNow = new Date().getTime() / 1000

                    if ((timeNow - timeToRefresh) > 7140 || timeToRefresh === 0) {
                        const res = await instance.post('login', {
                            email: "autopodberu1+1@gmail.com",
                            password: "TViGgDAg"
                        })
                        accessToken = res.data.token
                        status = res.data.status
                        timeToRefresh = new Date().getTime() / 1000
                    }

                    try {
                        if (status === 'ok') {
                            const {data} = await instance.get(url, {
                                headers: {Authorization: `Bearer ${accessToken}`},
                                responseType: "arraybuffer"
                            })
                            await fsPromises.writeFile(`./${chatId}file.pdf`, data, {encoding: 'binary'});
                            await bot.sendDocument(chatId, `./${chatId}file.pdf`, {}, {
                                filename: `${chatId}file.pdf`,
                                contentType: 'application/pdf'
                            })
                            await fsPromises.unlink(`./${chatId}file.pdf`)

                            allRequests += 1

                            await ListUsersUsed.findOne({first_name}).then((res) => {
                                if (res) {
                                    ListUsersUsed.checks += 1
                                }
                            }).catch(e => {
                                ListUsersUsed.create({first_name}).then(res => {
                                    ListUsersUsed.checks = 1
                                })
                            })
                            // await ListUsersUsed.create({first_name})

                            listUsersUsed[first_name] ? listUsersUsed[first_name] += 1 : listUsersUsed[first_name] = 1
                        }
                        if (status === 'error') {
                            return bot.sendMessage(chatId, 'Ошибка авторизации')
                        }
                    } catch (e) {
                        await bot.sendMessage(chatId, 'Ошибка сервиса')
                    }

                }


                if (match[0] === '001100') {
                    try {
                        await ListUsers.create({chatId: chatId})
                        await bot.sendPhoto(chatId, './assets/cover.png')
                        return bot.sendMessage(chatId, 'Теперь у вас есть права доступа', KEYBOARD)
                    } catch (e) {
                        const user = await ListUsers.findOne({chatId})
                        return user && bot.sendMessage(chatId, 'Вы уже авторизованы', KEYBOARD)
                    }

                }
                if (match[0] === '➕ add_user' && await authenticate_users(chatId)) {
                    return bot.sendMessage(chatId, 'Для того чтобы получить права доступа, новому юзеру надо просто написать пароль в строке ввода')
                }
                if (match[0] === '🪒 delete_user' && await authenticate_users(chatId)) {
                    return bot.sendMessage(chatId, `Чтобы удалить юзера просто напишите его номер ID`)
                }
                if (Number.isInteger(+msg.text) && +msg.text.length > 6 && await authenticate_users(chatId)) {
                    try {
                        const user = await ListUsers.findOne({chatId})
                        ListUsers.destroy({
                            where: {chatId: user.chatId}
                        }).then(res => {
                            return bot.sendMessage(chatId, `Пользователь удален`)
                        })
                        return
                    } catch (e) {
                        return bot.sendMessage(chatId, `Пользователь c таким ID не найден`)
                    }
                }


                if (match[0] === '💬 info' && await authenticate_users(chatId)) {
                    // const a = await ListUsers.findAll({attributes: ['chatId', 'checks']})
                    const userLists = await ListUsers.findAll()
                    const userList = userLists.map(u=>[u.chatId, u.checks])
                    return bot.sendMessage(chatId, userList.map(u => `\n<b>${u[0]}</b>: ${u[1]}`) + `\n<i>всего запросов: ${allRequests}</i>`, {parse_mode: 'HTML'})
                }


                if (allRequests !== 0 && (allRequests % 240 === 0 || allRequests % 245 === 0)) {
                    const allRequests = await ListUsers.findAll()
                    return bot.sendMessage(chatId, `Вы уже сделали ${allRequests} запросов, не забудтье пополнить счет`)
                }


                if (match[0] &&  await authenticate_users(chatId) === false) {
                    return bot.sendMessage(chatId, 'Вы не авторизованы, введите пароль')
                }
            } catch
                (e) {
                await bot.sendMessage(chatId, 'Something crashed on the server')
            }
        }
    )

}
const authenticate_users =  async (id) => {
        const user =  await ListUsers.findOne({id})
        return !!user
}


start()


