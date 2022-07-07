const {Scenes, session, Telegraf, Markup} = require('telegraf')
const channel = '@channeltest0007'
require('dotenv').config();
let i = 0
let messageId;

const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

//Scene
const SceneGenerator = require('./src/scene')
const curScene = new SceneGenerator()
const stage = new Scenes.Stage([curScene.GenTextScene().text, curScene.GenDateScene().timer, curScene.GenPublishScene()])

//Database
const mysql = require('mysql2')

let config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
}
let conn = mysql.createConnection(config)

checkConnection()

bot.use(session())
bot.use(stage.middleware())


bot.start(async (ctx) => {
  await ctx.scene.enter('text')
})

//Buttons
//Опубликовать
bot.action('btn--publish', async (ctx) => {
  if (curScene.GenTextScene().description !== undefined) {
    ctx.reply('Готово')
    let res = await ctx.telegram.sendMessage(channel, curScene.GenTextScene().description,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(`Участвую!`, 'btn--participate',)
        ]
      ]))
    messageId = res.message_id
    determineWinner(ctx, res)
  } else {
    ctx.reply('Текст не заполнен, запустите бота заново 🧐')
  }
})

//Участвовать
bot.action('btn--participate', async (ctx) => {
  if ((await ctx.telegram.getChatMember(channel, ctx.update.callback_query.from.id)).status !== 'left') {
    checkConnection()
    const query = `INSERT INTO user (username, user_id)
                   VALUES ('${ctx.update.callback_query.from.username}', '${ctx.update.callback_query.from.id}')`;
    
    conn.query(query, (err, result, field) => {
      if (messageId === ctx.update.callback_query.message.message_id) {
        console.log(result)
        if (result !== undefined) {
          ctx.answerCbQuery('Вы участвуете 💸')
          ctx.editMessageText(`${curScene.GenTextScene().description}`, Markup.inlineKeyboard([
            [
              Markup.button.callback(`Участвую! (${i += 1})`, 'btn--participate',)
            ]
          ]), {
            chat_id: channel,
            message_id: ctx.update.callback_query.message.message_id
          })
        } else {
          ctx.answerCbQuery('Вы уже участвуете в розыгрыше')
        }
      } else {
        ctx.answerCbQuery('Этот розыгрыше не актуален')
      }
    })
  } else {
    ctx.answerCbQuery('Чтобы принять участие, вы должны быть подписчиком канала')
  }
})

//Func
//Определить победитель
const determineWinner = (ctx, res) => {
  let timeFor = new Date(curScene.GenDateScene().dateChange).valueOf();
  let now = new Date().getTime();
  let sec = timeFor - now;
  let opts = {
    chat_id: channel,
    message_id: res.message_id
  }
  setTimeout(() => {
    //Запуск рандома
    getUsers(ctx, opts)
  }, sec)
}

function getUsers(ctx, opts) {
  checkConnection()
  const query = "SELECT * FROM user"
  let res = []
  conn.query(query, (err, result, field) => {
    if (err) {
      console.log(err)
    }
    console.log(result)
    result.forEach(item => {
      res.push(item.username)
    })
    return runRandomizer(ctx, opts, res)
  })
  
}

//Запустить  рандом
const runRandomizer = (ctx, opts, res) => {
  let winner
  //Выбираю победителя
  if (typeof res !== undefined && res.length > 0) {
    winner = res[Math.floor(Math.random() * res.length)]
  } else {
    winner = 'Победитель не определен'
  }
  ctx.editMessageText(`${curScene.GenTextScene().description}\n\nПобедитель: ${winner !== undefined ? winner : "Извините произошла ошибка"}`, opts)
  drorDatabase()
}

const drorDatabase = () => {
  //Callback на очищения базы
  const query = 'DELETE FROM user'
  conn.query(query, (err, result, field) => {
    if (result) {
      conn.end(err => {
        if (err) {
          console.log(err)
        } else {
          console.log('disconnected')
        }
      })
    }
  })
}

function checkConnection() {
  conn.connect(err => {
    if (err) {
      conn = mysql.createConnection(config)
    }
    console.log("Connection")
  })
}

bot.launch().then()

