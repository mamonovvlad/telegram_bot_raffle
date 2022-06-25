const {Markup, Scenes} = require('telegraf')


let dateChange;
let description;

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
    return {text, description}
  }
  
  //Время
  GenDateScene() {
    const timer = new Scenes.BaseScene('timer')
    timer.enter(async (ctx) => {
      await ctx.reply("Введите дату в формате\n(месяц/число/год часы:минуты:секунды || 09/24/2022 09:25:32)")
    })
    timer.on('text', async (ctx) => {
      dateChange = ctx.message.text;
      if (Date.parse(dateChange) && dateChange.length === 19) {
        await ctx.scene.enter('buttons')
      } else {
        ctx.reply('Ошибка')
      }
    })
    return {timer, dateChange}
  }
  
  //Кнопки
  GenPublishScene() {
    const buttons = new Scenes.BaseScene('buttons')
    buttons.enter(async (ctx) => {
      await ctx.reply('Опубликовать розыгрышь или отменить',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('Опубликовать', 'btn--publish'), Markup.button.callback('Создать заново', 'btn--recreate')
          ]
        ]))
      
    })
    
    return buttons
  }
}

module.exports = SceneGenerator
