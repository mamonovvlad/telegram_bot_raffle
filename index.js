const {Scenes, session, Telegraf, Markup} = require('telegraf')
const schedule = require('node-schedule')
require('dotenv').config();
let i = 0

const channel = process.env.TELEGRAM_CHANNEL
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

bot.use(session())
bot.use(stage.middleware())


bot.start(async (ctx) => {
  await ctx.scene.enter('text')
})

//Buttons
//Участвовать
bot.action('btn--participate', async (ctx) => {
  if ((await ctx.telegram.getChatMember(channel, ctx.update.callback_query.from.id)).status !== 'left') {
    conn.connect(err => {
      if (err) {
        conn = mysql.createConnection(config)
      }
      const getUsersInfo = `INSERT INTO user (username, user_id)
                            VALUES ('${ctx.update.callback_query.from.username}', '${ctx.update.callback_query.from.id}
                                    ')`;
      
      conn.query(getUsersInfo, (err, resultUsers, field) => {
        const getMessage = `SELECT *
                            FROM info_chat`
        conn.query(getMessage, (err, resultMessage) => {
          resultMessage.forEach(item => {
            if (item.message_id === ctx.update.callback_query.message.message_id) {
              if (resultUsers !== undefined) {
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
        })
      })
    })
  } else {
    ctx.answerCbQuery('Чтобы принять участие, вы должны быть подписчиком канала')
  }
  
})

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
      conn.connect(err => {
          if (err) {
            conn = mysql.createConnection(config)
          }
          let infoChat = `SELECT *
                          FROM info_chat`
          conn.query(infoChat, (err, result) => {
            if (result.length > 0 && typeof result !== undefined) {
              const updateDate = `UPDATE info_chat
                                  SET date       = '${curScene.GenDateScene().dateChange}',
                                      message_id = '${res.message_id}'`;
              conn.query(updateDate, (err, result) => {
                determineWinner(ctx)
              })
            } else {
              const saveData = `INSERT INTO info_chat (date, message_id)
                                VALUES ('${curScene.GenDateScene().dateChange}', '${res.message_id}')`;
              conn.query(saveData, (err, result) => {
                determineWinner(ctx)
              })
            }
            
          })
        }
      )
    } else {
      ctx.reply('Текст не заполнен, запустите бота заново 🧐')
    }
  }
)

//Func
//Определить победитель
const determineWinner = (ctx) => {
  conn.connect(err => {
    if (err) {
      conn = mysql.createConnection(config)
    }
    
    const query = "SELECT * FROM info_chat"
    conn.query(query, (err, result) => {
      result.forEach(item => {
        let drawDate = new Date(item.date)
        let opts = {
          chat_id: channel,
          message_id: item.message_id
        }
        schedule.scheduleJob(drawDate, () => {
          console.log('Запуск рандома')
          runRandomizer(ctx, opts)
        })
      })
      
      
    })
  })
}

//Запустить  рандом
const runRandomizer = (ctx, opts) => {
  let winner
  conn.connect(err => {
    if (err) {
      conn = mysql.createConnection(config)
    }
    const query = "SELECT * FROM user"
    let res = []
    conn.query(query, (err, result, field) => {
      result.forEach(item => {
        res.push(item.username)
      })
      //Выбираю победителя
      if (typeof res !== undefined && res.length > 0) {
        winner = res[Math.floor(Math.random() * res.length)]
      } else {
        winner = 'Победитель не определен'
      }
      ctx.editMessageText(`${curScene.GenTextScene().description}\n\nПобедитель: ${winner !== undefined ? winner : "Извините произошла ошибка"}`, opts)
      drorDatabase()
    })
  })
  
  
}

const drorDatabase = () => {
  //Callback на очищения базы
  const query = 'DELETE FROM user'
  conn.query(query, (err, result, field) => {
    if (err) {
      console.log(err, 'drorDatabase')
    }
  })
}


bot.launch().then()

