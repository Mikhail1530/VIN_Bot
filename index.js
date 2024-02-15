const TelegramApi = require('node-telegram-bot-api')
const axios = require('axios')
const token = '6841869139:AAGsQ-6C3FJxfVPdfJko7Sa2evA0Hyz5Yy4'
const bot = new TelegramApi(token, {polling: true})
const fsPromises = require('fs').promises
const sequelize = require('./db')
const {ListUsers} = require('./models')
const {logger} = require("sequelize/lib/utils/logger");

const instance = axios.create({
    baseURL: "https://www.clearvin.com/rest/vendor/",
});

const validValues = ['🆔 id', '💬 info', '➕ add_user', '🪒 delete_user', '✅ VIN', '/start']

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
    ])
    bot.onText(/(.+)/, async (msg, match) => {
            const userName = msg.from.first_name
            const chatId = msg.chat.id

            const useList = await ListUsers.findAll()
            const allReq = useList.map(u => u['checks']).reduce((acc, cur) => {
                acc += cur
                return acc
            }, 0)


            try {
                if (match[0] === '🆔 id' && await authenticate_users(chatId)) {
                    try {
                        const user = await ListUsers.findOne({where: {chatId: chatId}})
                        return bot.sendMessage(chatId, `<b>${user.userName}</b>. Ваш ID: ${user.chatId}`, {parse_mode: 'HTML'})
                    } catch (e) {
                        return bot.sendMessage(chatId, 'Нибумбум')
                    }
                }
                if (match[0] === '✅ VIN' && await authenticate_users(chatId)) {
                    await bot.sendMessage(chatId, 'Введите <b>VIN</b> авто (17 символов)', {parse_mode: 'HTML'})
                }

                if (match[0].length === 17 && await authenticate_users(chatId)) {
                    await bot.sendMessage(chatId, 'Запрос займет немного времени, ожидайте')
                    const url = `report?vin=${msg.text}&format=pdf&reportTemplate=2021`

                    const objTokenDate = await fsPromises.readFile('../token.js', 'utf8')
                    const time = JSON.parse(objTokenDate).date
                    let timeNow = Math.floor(new Date().getTime() / 1000)

                    if ((timeNow - time) > 7140) {
                        const result = await instance.post('login', {
                            email: "autopodberu1+1@gmail.com",
                            password: "TViGgDAg"
                        })
                        const obj = JSON.stringify({token: result.data.token, date: timeNow})
                        await fsPromises.writeFile('../token.js', obj)
                    }

                    try {
                        const getToken = await fsPromises.readFile('../token.js', 'utf8')
                        const accessToken = JSON.parse(getToken).token
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
                        await ListUsers.increment('checks', {by: 1, where: {chatId: chatId}})
                    } catch (e) {
                        await bot.sendMessage(chatId, 'Такого VIN номера в базе нет')
                    }
                }

                if (match[0] === '001100') {
                    try {
                        await ListUsers.create({chatId: chatId, userName: userName})
                        await bot.sendPhoto(chatId, './assets/cover.png')
                        return bot.sendMessage(chatId, 'Теперь у вас есть права доступа', KEYBOARD)
                    } catch (e) {
                        const user = await ListUsers.findOne({where: {chatId: chatId}})
                        return user && bot.sendMessage(chatId, 'Вы уже авторизованы', KEYBOARD)
                    }
                }


                if (match[0] === 'added') {
                    const res = await ListUsers.findAll()
                    console.log(res.map(el => el['chatId'] + el['userName'] + el['checks']))
                }
                if (match[0] === '➕ add_user' && await authenticate_users(chatId)) {
                    return bot.sendMessage(chatId, 'Для того чтобы получить права доступа, новому юзеру надо просто написать пароль в строке ввода')
                }
                if (match[0] === '🪒 delete_user' && await authenticate_users(chatId)) {
                    return bot.sendMessage(chatId, `Чтобы удалить юзера просто напишите его номер ID`)
                }
                if (Number.isInteger(+msg.text) && +msg.text.length > 6 && await authenticate_users(chatId)) {
                    try {
                        const user = await ListUsers.findOne({where: {chatId: +msg.text}})
                        await ListUsers.destroy({where: {chatId: user.chatId}})
                        return bot.sendMessage(chatId, `Пользователь удален`)
                    } catch (e) {
                        return bot.sendMessage(chatId, `Пользователь c таким ID не найден`)
                    }
                }
                if (match[0] === '💬 info' && await authenticate_users(chatId)) {
                    const userLists = await ListUsers.findAll()
                    const userList = userLists.map(u => [u.userName, u.checks])
                    const allRequests = userList.reduce((acc, cur) => {
                        acc += cur[1]
                        return acc
                    }, 0)
                    return bot.sendMessage(chatId, userList.map(u => `\n<b>${u[0]}</b>: ${u[1]}`) + `\n<i>всего запросов: ${allRequests}</i>`, {parse_mode: 'HTML'})
                }
                if (allReq !== 0 && (allReq % 240 === 0 || allReq % 245 === 0)) {
                    return bot.sendMessage(chatId, `Вы уже сделали ${allReq} запросов, не забудтье пополнить счет`)
                }


                if (match[0] && await authenticate_users(chatId) === false) {
                    return bot.sendMessage(chatId, 'Вы не авторизованы, введите пароль')
                }
                if (match[0] === '/start' && await authenticate_users(chatId)) {
                    return bot.sendMessage(chatId, 'Бот уже запущен', KEYBOARD)
                }
                if (!validValues.includes(match[0]) && !Number.isInteger(+msg.text) && await authenticate_users(chatId) && match[0].length !== 17) {
                    return bot.sendMessage(chatId, 'Что-то не то ты мутишь... 🙄')
                }
            } catch
                (e) {
                await bot.sendMessage(chatId, 'Something crashed on the server')
            }
        }
    )

}
const authenticate_users = async (id) => {
    const user = await ListUsers.findOne({where: {chatId: id}})
    return !!user
}


start()


