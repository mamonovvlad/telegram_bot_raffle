const {Scenes, session, Telegraf, Markup} = require('telegraf')
const channel = "@channeltest0007"
require('dotenv').config()

// const bot = new Telegraf('5333642362:AAHWgFsRXBTFyfnHj6vvZFXJTY8mTt4AwBo')
const bot = new Telegraf(process.env.TOKEN)


const SceneGenerator = require('./src/scene')

// const mongodb = require("./db");
const curScene = new SceneGenerator()


const stage = new Scenes.Stage([curScene.GenTextScene().text, curScene.GenDateScene().timer, curScene.GenPublishScene()])

bot.use(session())
bot.use(stage.middleware())


bot.start(async (ctx) => {
  await ctx.scene.enter('text')
})


//Опубликовать
bot.action('btn--publish', async (ctx) => {
  const description = curScene.GenTextScene().description
  let timeFor = new Date(curScene.GenDateScene().dateChange).valueOf();
  let now = new Date().getTime();
  let sec = timeFor - now;
  
  ctx.reply('Готово')
  let res = await ctx.telegram.sendMessage(channel, description,
    Markup.inlineKeyboard([
      [
        Markup.button.callback(`Участвовать`, 'btn--participate',)
      ]
    ]))
  
  let opts = {
    chat_id: channel,
    message_id: res.message_id
  }
  
  setTimeout(() => {
    ctx.editMessageText(`${description}\n\nПобедитель(-и): @MamonovVlad`, opts)
  }, sec)
  
})

//Создать заново
bot.action('btn--recreate', async (ctx) => {
  try {
    await ctx.scene.enter('text')
  } catch (e) {
    console.error(e)
  }
})

//Участвовать
bot.action('btn--participate', async (ctx) => {
  ctx.answerCbQuery('Вы участвуите')
  console.log(ctx.update.callback_query.from)
  
})

bot.launch().then()
