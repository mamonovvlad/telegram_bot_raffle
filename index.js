const {Scenes, session, Telegraf, Markup} = require('telegraf')
const channel = '@channeltest0007'
require('dotenv').config();
let i = 0
let winner

const bot = new Telegraf(process.env.TOKEN)

//Scene
const SceneGenerator = require('./src/scene')
const curScene = new SceneGenerator()
const stage = new Scenes.Stage([curScene.GenTextScene().text, curScene.GenDateScene().timer, curScene.GenPublishScene()])

//Database
const mysql = require('mysql')


const conn = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
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
    console.log('Опубликовать')
  } else {
    ctx.reply('Текст не заполнен, запустите бота заново 🧐')
  }
})

//Участвовать
bot.action('btn--participate', async (ctx) => {
  const query = `INSERT INTO user (username, user_id)
                 VALUES ('${ctx.update.callback_query.from.username}', '${ctx.update.callback_query.from.id}')`;
  conn.query(query, (err, result, field) => {
    if (err) {
      // console.log(err, 'fetchUsers')
    }
    console.log(result, 'Участвовать')
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
  console.log('Определить победитель')
  console.log(timeFor, now, sec)
  console.log()
  setTimeout(() => {
    //Запуск рандома
    console.log('Запуск рандома')
    runRandomizer(ctx, opts, drorDatabase)
  }, sec)
}

//Запустить  рандом
const runRandomizer = (ctx, opts, callback) => {
  const participants = [];
  const query = "SELECT * FROM user"
  conn.query(query, (err, result, field) => {
    if (err) {
      console.log(err)
    }
    console.log(result, 'Старт Рандома')
    //Перебираю users
    result.forEach(item => {
      participants.push(item.username);
    })
    
    //Выбираю победителя
    winner = participants[Math.floor(Math.random() * participants.length)]
    ctx.editMessageText(`${curScene.GenTextScene().description}\nПобедитель(-и): ${winner !== undefined ? winner : "Извените произошла ошибка"}`, opts)
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
    console.log(result, 'Callback на очищения базы')
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

