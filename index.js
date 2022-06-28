const {Scenes, session, Telegraf, Markup} = require('telegraf')
const channel = '@channeltest0007'
require('dotenv').config();
// const bot = new Telegraf(process.env.TOKEN)
const bot = new Telegraf('5333642362:AAHWgFsRXBTFyfnHj6vvZFXJTY8mTt4AwBo')

//Scene
const SceneGenerator = require('./src/scene')
const curScene = new SceneGenerator()
const stage = new Scenes.Stage([curScene.GenTextScene().text, curScene.GenDateScene().timer, curScene.GenPublishScene()])

//Database
const mysql = require('mysql')

const conn = mysql.createConnection({
  host: '188.166.40.146',
  user: 'vlad',
  password: 'paSsrt45gbfht44eddss17yrgfghjj2ertew',
  database: 'pool'
})


conn.connect(err => {
  if (err) {
    console.log(err)
  }
  console.log('connect ---------------------------------------------------')
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
  const query = `INSERT INTO user (username, user_id)
                 VALUES ('${ctx.update.callback_query.from.username}', '${ctx.update.callback_query.from.id}')`;
  conn.query(query, (err, result, field) => {
    if (err) {
      // console.log(err, 'fetchUsers')
    }
    if (result !== undefined) {
      ctx.answerCbQuery('Вы участвуете 💸')
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
  
  setTimeout(() => {
    //Запуск рандома
    runRandomizer(ctx, opts, () => {
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
    })
  }, sec)
}

//Запустить  рандом
const runRandomizer = (ctx, opts, callback) => {
  const participants = [];
  let winner;
  const query = "SELECT * FROM user"
  conn.query(query, (err, result, field) => {
    if (err) {
      console.log(err)
    }
    console.log(result, 'runRandomizer')
    //Перебираю users
    result.forEach(item => {
      participants.push(item.username);
    })
    
    
    //Выбираю победителя
    winner = participants[Math.floor(Math.random() * participants.length)]
    ctx.editMessageText(`${curScene.GenTextScene().description}\nПобедитель(-и): ${winner !== undefined ? winner : "Извените произошла ошибка"}`, opts)
  })
  return callback()
}

bot.launch().then()

