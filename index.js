const TelegramApi = require('node-telegram-bot-api')
const axios = require('axios')
const token = '6841869139:AAGsQ-6C3FJxfVPdfJko7Sa2evA0Hyz5Yy4'
const bot = new TelegramApi(token, {polling: true})
const fsPromises = require('fs').promises

// const tokenVin = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnZpcm9ubWVudCI6InRlc3QiLCJ1c2VyIjp7ImlkIjoyMDg1MTEsImVtYWlsIjoiYXV0b3BvZGJlcnUxKzFAZ21haWwuY29tIn0sInZlbmRvciI6eyJpZCI6MjczLCJzdGF0dXMiOiJhY3RpdmUiLCJpcCI6WyIxNzIuMjAuMTAuMyIsIjU0Ljg2LjUwLjEzOSIsIjE4NS4xMTUuNC4xNDciLCIxODUuMTE1LjUuMjgiLCI1LjE4OC4xMjkuMjM2Il19LCJpYXQiOjE3MDYwMTI1NzQsImV4cCI6MTcwODYwNDU3NH0.D5hOhF4CUOcMlyE4meRRPggfnZpKejKgDcHrlAWM6e4'
const instance = axios.create({
    baseURL: "https://www.clearvin.com/rest/vendor/",
    // responseType: "arraybuffer",
    // headers: {
    //     Authorization: `Bearer ${tokenVin}`,
    // },
});
let authUsersIdList = []
let listUsersUsed = {}
let allRequests = 0
const requestsPerMonth = 250


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
const start = () => {
    bot.setMyCommands([
        {command: '/start', description: 'Запустить бота'},
        {command: '/id', description: 'Узнать свой ID'},
    ])
    bot.onText(/(.+)/, async (msg, match) => {
        if (match[0] == '🆔 id' && authenticate_users(msg.from.id)) {
            await bot.sendMessage(msg.chat.id, 'Ваш ID: ' + msg.from.id)
        }
        if (match[0] == '✅ VIN' && authenticate_users(msg.from.id)) {
            await bot.sendMessage(msg.chat.id, 'Введите VIN авто (17 символов)')
        }


        if (match[0].length === 17 && authenticate_users(msg.from.id)) {
            const url = `report?vin=${msg.text}&format=pdf&reportTemplate=2021`
            let accessToken = ''
            try {
                const res = await instance.post('login', {
                    email: "autopodberu1+1@gmail.com",
                    password: "TViGgDAg"
                })
                if (res) {
                    console.log(res)
                }
            } catch (e) {
                console.log(e)
            }
            //     .then((res) => {
            //     console.log(res)
            //     if (res.data.status.toString() === 'ok') {
            //         accessToken = res.token
            //     } else {
            //         return bot.sendMessage(msg.chat.id, 'Ошибка авторизации')
            //     }
            // }).catch(e => console.log(e))

            //     const {data} = await instance.get(url, {
            //         headers: {Authorization: `Bearer ${accessToken}`},
            //         responseType: "arraybuffer"
            //     })
            //
            //     await fsPromises.writeFile(`./${msg.chat.id}file.pdf`, data, {encoding: 'binary'});
            //     await bot.sendDocument(msg.chat.id, `./${msg.chat.id}file.pdf`, {}, {
            //         filename: `${msg.chat.id}file.pdf`,
            //         contentType: 'application/pdf'
            //     })
            //
            //     await fsPromises.unlink(`./${msg.chat.id}file.pdf`)
            //     allRequests += 1
            //     listUsersUsed[msg.from.first_name] ? listUsersUsed[msg.from.first_name] += 1 : listUsersUsed[msg.from.first_name] = 1
            // }
            // catch (e) {
            // if we get error (message field is there), we must update token -> post request we need to do
            //     await bot.sendMessage(msg.chat.id, 'Данного VIN номера в базе не существует')
            // }

        }


        if (match[0] == '001100') {
            authUsersIdList.push(msg.from.id)
            await bot.sendPhoto(msg.chat.id, './assets/cover.png')
            await bot.sendMessage(msg.chat.id, 'Теперь у вас есть права доступа', KEYBOARD)
        }
        if (match[0] == '➕ add_user' && authenticate_users(msg.from.id)) {
            await bot.sendMessage(msg.chat.id, 'Для того чтобы получить права доступа, новому юзеру надо просто написать пароль в строке ввода')
        }
        if (match[0] == '🪒 delete_user' && authenticate_users(msg.from.id)) {
            await bot.sendMessage(msg.chat.id, `Чтобы удалить юзера просто напишите его номер ID`)
        }
        if (Number.isInteger(+msg.text) && +msg.text.length > 6 && authenticate_users(msg.from.id)) {
            if (authUsersIdList.includes(+msg.text)) {
                authUsersIdList = authUsersIdList.filter(u => u !== +msg.text)
                await bot.sendMessage(msg.chat.id, `Пользователь удален`)
            } else {
                await bot.sendMessage(msg.chat.id, `Пользователь c таким ID не найден`)
            }
        }
        if (match[0] == '💬 info' && authenticate_users(msg.from.id)) {
            await bot.sendMessage(msg.chat.id, Object.entries(listUsersUsed).map(el => `\n<b>${el[0]}</b>: ${el[1]}`) + `\n<i>всего запросов: ${allRequests}</i>`, {parse_mode: 'HTML'})
        }
        if (allRequests !== 0 && (allRequests % 240 === 0 || allRequests % 245 === 0)) {
            await bot.sendMessage(msg.chat.id, `Осталось ${requestsPerMonth - allRequests} запросов`)
        }
        if (match[0] && !authenticate_users(msg.from.id)) {
            await bot.sendMessage(msg.chat.id, 'Вы не авторизованы, введите пароль')
        }
    })

    function authenticate_users(id) {
        for (let i = 0; i < authUsersIdList.length; i++) {
            if (authUsersIdList[i] == id) {
                return true
            }
        }
        return false
    }
}
start()


