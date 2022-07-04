const {Scenes, session, Telegraf, Markup} = require('telegraf')
const channel = '@channeltest0007'
require('dotenv').config();
let i = 0

const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

//Scene
const SceneGenerator = require('./src/scene')
const curScene = new SceneGenerator()
const stage = new Scenes.Stage([curScene.GenTextScene().text, curScene.GenDateScene().timer, curScene.GenPublishScene()])

//Database
const mysql = require('mysql2')


const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
})

conn.connect(err => {
  if (err) {
    console.log(err)
  }
  console.log('Connect!')
})

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
    
    determineWinner(ctx, res)
  } else {
    ctx.reply('Текст не заполнен, запустите бота заново 🧐')
  }
})

//Участвовать
bot.action('btn--participate', async (ctx) => {
  if ((await ctx.telegram.getChatMember(channel, ctx.update.callback_query.from.id)).status !== 'left') {
    const query = `INSERT INTO user (username, user_id)
                   VALUES ('${ctx.update.callback_query.from.username}', '${ctx.update.callback_query.from.id}')`;
    conn.query(query, (err, result, field) => {
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
    runRandomizer(ctx, opts, drorDatabase)
  }, sec)
}

//Запустить  рандом
const runRandomizer = (ctx, opts, callback) => {
  const participants = []
  const query = "SELECT * FROM user"
  conn.query(query, (err, result, field) => {
    if (err) {
      console.log(err)
    }
    //Перебираю users
    console.log(result)
    if (result) {
      result.forEach(item => {
        participants.push(item.username);
      })
    } else {
      participants.push('Победитель не определен')
    }
 
    //Выбираю победителя
   let winner = participants[Math.floor(Math.random() * participants.length)]
    console.log(winner)
    ctx.editMessageText(`${curScene.GenTextScene().description}\n\nПобедитель: ${winner !== undefined ? winner : "Извините произошла ошибка"}`, opts)
  })
  callback()
}

const drorDatabase = () => {
  //Callback на очищения базы
  const query = 'DELETE FROM user'
  conn.query(query, (err, result, field) => {
    if (err) {
      console.log(err)
    }
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

bot.launch().then()

