const {Scenes, session, Telegraf, Markup} = require('telegraf')
const schedule = require('node-schedule')
require('dotenv').config();
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
  database: process.env.DB_DATABASE,
}

let conn = mysql.createConnection(config)

bot.use(session())
bot.use(stage.middleware())

bot.command('vladbreyzhopu', async (ctx) => {
  if (ctx.from.id === 374869670 || ctx.from.id === 789088476) {
    await ctx.scene.enter('text')
  } else {
    ctx.reply('Извините, вы не являетесь владелецем бота 😜')
  }
})


//Buttons
//Участвовать
bot.action('btn--participate', (ctx) => {
  checkingConn(ctx).then(async err => {
    if ((await ctx.telegram.getChatMember(channel, ctx.update.callback_query.from.id)).status !== 'left') {
      const getUsersInfo = `INSERT INTO user (username, user_id)
                            VALUES ('${ctx.update.callback_query.from.username}', '${ctx.update.callback_query.from.id}
                                  ')`;
      conn.query(getUsersInfo, async (err, resultUsers) => {
        if (typeof resultUsers !== "undefined") {
          ctx.answerCbQuery('Вы участвуете 💸')
        } else {
          ctx.answerCbQuery('Вы уже участвуете в розыгрыше')
        }
      })
    } else {
      ctx.answerCbQuery('Чтобы принять участие, вы должны быть подписчиком канала')
    }
    conn.end()
  })
})


//Опубликовать
bot.action('btn--publish', async (ctx) => {
  if (curScene.GenTextScene().description !== undefined) {
    ctx.reply('Готово')
    let res = await ctx.telegram.sendMessage(channel, curScene.GenTextScene().description,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(`Я Участвую / I Participate`, 'btn--participate',)
        ]
      ]))
    
    let infoChat = `SELECT *
                    FROM info_chat`
    checkingConn().then(err => {
      conn.query(infoChat, async (err, result) => {
        if (typeof result !== undefined && result != null && result.length != null && result.length > 0) {
          const updateDate = `UPDATE info_chat
                              SET date        = '${curScene.GenDateScene().dateChange}',
                                  message_id  = '${res.message_id}',
                                  description = '${curScene.GenTextScene().description}'`;
          checkingConn().then(err => {
            conn.query(updateDate, (err, result) => {
              determineWinner(ctx)
            })
            conn.end();
          })
        } else {
          const saveData = `INSERT INTO info_chat (date, message_id, description)
                            VALUES ('${curScene.GenDateScene().dateChange}', '${res.message_id}',
                                    '${curScene.GenTextScene().description}')`;
          checkingConn().then(err => {
            conn.query(saveData, async (err, result) => {
              determineWinner(ctx)
            })
            conn.end();
          })
        }
      })
      conn.end();
    })
  } else {
    ctx.reply('Текст не заполнен, запустите бота заново 🧐')
  }
})

//Func


//Определить победитель
function determineWinner() {
  const query = "SELECT * FROM info_chat"
  checkingConn().then(err => {
    conn.query(query, (err, result) => {
      result.forEach(item => {
        let drawDate = new Date(item.date)
        console.log(drawDate)
        if (typeof drawDate !== undefined || drawDate.length > 0) {
          if (drawDate > new Date()) {
            schedule.scheduleJob(drawDate, () => {
              runRandomizer(item.message_id, item.description)
            })
          } else if (new Date() > drawDate) {
            runRandomizer(item.message_id, item.description)
          }
        }
      })
    })
    conn.end()
  })
}


//Запустить  рандом
function runRandomizer(message_id, text) {
  let winner
  let res = []
  const query = "SELECT * FROM user"
  checkingConn().then(error => {
    conn.query(query, async (err, result, field) => {
      result.forEach(item => {
        res.push(item.username)
      })
      //Выбираю победителя
      if (typeof res !== undefined && res.length > 0) {
        winner = '@' + res[Math.floor(Math.random() * res.length)]
      } else {
        winner = 'Победитель не определен'
      }
      await bot.telegram.editMessageText(channel, message_id,
        message_id,
        `${text}\n\nПобедитель: ${typeof winner !== undefined ? winner : "Извините произошла ошибка"}`
      )
      drorDatabase()
    })
    conn.end();
  })
}

function drorDatabase() {
  //Callback на очищения базы
  const queryUser = 'DELETE FROM user'
  const queryInfoChat = 'DELETE FROM info_chat'
  checkingConn().then(err => {
    conn.query(queryUser, (err, result, fields) => {
    })
    conn.query(queryInfoChat, (err, result, fields) => {
    })
    conn.end();
  })
  
  
}

async function checkingConn() {
  const disconnected = await new Promise(resolve => {
    conn.ping(err => {
      resolve(err);
    });
  });
  if (disconnected) {
    conn = mysql.createConnection(config)
  }
}


// determineWinner();
bot.launch().then()
