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
bot.start(async (ctx) => {
  await ctx.scene.enter('text')
})


//Buttons
//Участвовать
bot.action('btn--participate', async (ctx) => {
  if ((await ctx.telegram.getChatMember(channel, ctx.update.callback_query.from.id)).status !== 'left') {
    const getUsersInfo = `INSERT INTO user (username, user_id)
                          VALUES ('${ctx.update.callback_query.from.username}', '${ctx.update.callback_query.from.id}
                                  ')`;
    const disconnected = await new Promise(resolve => {
      conn.ping(err => {
        resolve(err);
      });
    });
    if (disconnected) {
      conn = mysql.createConnection(config)
    }
    conn.query(getUsersInfo, async (err, resultUsers) => {
      const getMessage = `SELECT *
                          FROM info_chat`
      conn.query(getMessage, (err, resultMessage) => {
        
        console.log(resultMessage)
        resultMessage.forEach(item => {
          console.log(item.message_id, ctx.update.callback_query.message.message_id)
          if (item.message_id === ctx.update.callback_query.message.message_id) {
            if (resultUsers !== undefined) {
              ctx.answerCbQuery('Вы участвуете 💸')
            } else {
              ctx.answerCbQuery('Вы уже участвуете в розыгрыше')
            }
          } else {
            ctx.answerCbQuery('Этот розыгрыше не актуален')
          }
        })
      })
      conn.end();
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
      
      let infoChat = `SELECT *
                      FROM info_chat`
      const disconnected = await new Promise(resolve => {
        conn.ping(err => {
          resolve(err);
        });
      });
      if (disconnected) {
        conn = mysql.createConnection(config)
      }
      conn.query(infoChat, async (err, result) => {
        if (err) {
          console.log(err)
        }
        const disconnected = await new Promise(resolve => {
          conn.ping(err => {
            resolve(err);
          });
        });
        if (disconnected) {
          conn = mysql.createConnection(config)
        }
        if (result.length > 0 && typeof result !== undefined) {
          const updateDate = `UPDATE info_chat
                              SET date       = '${curScene.GenDateScene().dateChange}',
                                  message_id = '${res.message_id}'`;
          conn.query(updateDate, async (err, result) => {
            if (err) {
              console.log(err)
            }
            await determineWinner(ctx)
          })
          conn.end();
        } else {
          console.log('1')
          const saveData = `INSERT INTO info_chat (date, message_id)
                            VALUES ('${curScene.GenDateScene().dateChange}', '${res.message_id}')`;
          const disconnected = await new Promise(resolve => {
            conn.ping(err => {
              resolve(err);
            });
          });
          if (disconnected) {
            conn = mysql.createConnection(config)
          }
          conn.query(saveData, async (err, result) => {
            if (err) {
              console.log(err)
            }
            await determineWinner(ctx)
          })
          conn.end();
        }
      })
      conn.end();
    } else {
      ctx.reply('Текст не заполнен, запустите бота заново 🧐')
    }
  }
)

//Func
//Определить победитель
async function determineWinner(ctx) {
  const query = "SELECT * FROM info_chat"
  const disconnected = await new Promise(resolve => {
    conn.ping(err => {
      resolve(err);
    });
  });
  if (disconnected) {
    conn = mysql.createConnection(config)
  }
  conn.query(query, (err, result) => {
    result.forEach(item => {
      let drawDate = new Date(item.date)
      let opts = {
        chat_id: channel,
        message_id: item.message_id
      }
      schedule.scheduleJob(drawDate, () => {
        runRandomizer(ctx, opts)
      })
    })
  })
  
}

//Запустить  рандом
async function runRandomizer(ctx, opts) {
  const disconnected = await new Promise(resolve => {
    conn.ping(err => {
      resolve(err);
    });
  });
  if (disconnected) {
    conn = mysql.createConnection(config)
  }
  let winner
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
  conn.end();
  
}

async function drorDatabase() {
  //Callback на очищения базы
  const disconnected = await new Promise(resolve => {
    conn.ping(err => {
      resolve(err);
    });
  });
  if (disconnected) {
    conn = mysql.createConnection(config)
  }
  const query = 'DELETE FROM user'
  conn.query(query, (err, result, field) => {
  })
  conn.end();
  
}

bot.launch().then()
