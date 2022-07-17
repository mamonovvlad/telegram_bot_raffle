const {Markup, Scenes} = require('telegraf')
let dateChange;
let description;

class SceneGenerator {
  
  //Описание
  GenTextScene() {
    const text = new Scenes.BaseScene('text')
    text.enter((ctx) => ctx.reply(`Привет ${ctx.from.first_name ? ctx.from.first_name : 'Незнакомец'}, я one_chance_bot и я могу выбирать случайного человека из Вашей группы, пользователю достаточно нажать на кнопку "Я участвую" в заданном Вами промежутке времени.\nНапишите текст розыграша ниже`))
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
      await ctx.reply("Введите дату в формате ⏰\nВыставлять время по Киеву\n12/31/2000 10:00:00")
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
      await ctx.reply('Розыгрыш готов 🥳',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('Опубликовать', 'btn--publish')
          ]
        ]))
      
    })
    
    return buttons
  }
}

module.exports = SceneGenerator
