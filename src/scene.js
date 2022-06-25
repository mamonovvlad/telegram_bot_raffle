const {Markup, Composer, Scenes} = require('telegraf')
const channel = "@channeltest0007"
const mongodb = require('../db')

let description;
let dateText;

// let seconds;

class SceneGenerator {
  
  //Описание
  GenTextScene() {
    const text = new Scenes.BaseScene('text')
    text.enter((ctx) => ctx.reply(`Привет ${ctx.from.first_name ? ctx.from.first_name : 'Незнакомец'}, напиши текст для розыгрыша `))
    text.on('message', async (ctx) => {
      description = ctx.message.text;
      
      if (description.length > 0 && description) {
        await ctx.scene.enter('timer')
      }
    })
    
    return text
  }
  
  //Время
  GenDateScene() {
    const timer = new Scenes.BaseScene('timer')
    timer.enter(async (ctx) => {
      await ctx.reply("Введите дату в формате\n(месяц/число/год часы:минуты:секунды || 09/24/2022 09:25:32)")
    })
    timer.on('text', async (ctx) => {
      dateText = ctx.message.text;
      if (Date.parse(dateText) && dateText.length === 19) {
        await ctx.scene.enter('buttons')
      } else {
        ctx.reply('Ошибка')
      }
    })
    return timer
  }
  
  //Кнопки
  GenPublishScene() {
    const buttons = new Scenes.BaseScene('buttons')
    buttons.enter(async (ctx) => {
      await ctx.reply('Опубликовать розыгрышь или отменить',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('Опубликовать', 'btn--publish'), Markup.button.callback('Предпросмотр', 'btn--preview'),
          ],
          [
            Markup.button.callback('Отменить', 'btn--cansel'), Markup.button.callback('Создать заново', 'btn--recreate')
          ]
        ]))
      
    })
    
    
    //Опубликовать
    buttons.action('btn--publish', async (ctx) => {
      let timeFor = new Date(dateText).valueOf();
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
      
      ctx.getChatMenuButton({channel}, async (ctx) => {
        await console.log(ctx)
      })
      
      setTimeout(() => {
        ctx.editMessageText(`${description}\n\nПобедитель(-и): @MamonovVlad`, opts)
      }, sec)
      
      
    })
    
    //Предпросмотр
    buttons.action('btn--preview', async (ctx) => {
      try {
        ctx.reply(description, Markup.inlineKeyboard([
          [
            Markup.button.callback(`${description}\n\nПобедитель(-и): @MamonovVlad`, 'btn--participate')
          ]
        ]))
        
      } catch (e) {
        console.error(e)
      }
    })
    
    //Отменить
    buttons.action('btn--cansel', async (ctx) => {
      try {
        ctx.reply('Бот остановлен')
      } catch (e) {
        console.error(e)
      }
    })
    
    //Создать заново
    buttons.action('btn--recreate', async (ctx) => {
      try {
        await ctx.scene.enter('text')
      } catch (e) {
        console.error(e)
      }
    })
  
    buttons.callbackQuery('exfc')
    // buttons.on('callback_query', async (ctx) => {
    //   // Участвовать
    //   buttons.action('btn--participate', async (ctx) => {
    //     await console.log(ctx.update.callback_query.from)
    //     buttons.answerCallbackQuery('Вы выбрали: ')
    //     // await JSON.stringify(fetchUsers(ctx.update.callback_query.from))
    //   })
    // })
    return buttons
  }
  
}



// async function fetchUsers(data) {
//   console.log(data)
//   const filter = {id: data.id}
//   const users = (await mongodb).db("telegram").collection('users');
//   await users.updateOne(filter, {$set: data}, {upsert: true})
//   return await users.findOne(filter)
// }

module.exports = SceneGenerator
