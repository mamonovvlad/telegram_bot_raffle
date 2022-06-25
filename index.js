let TelegramBot = require('node-telegram-bot-api');

// Устанавливаем токен, который выдавал нам бот.
let token = '5333642362:AAHWgFsRXBTFyfnHj6vvZFXJTY8mTt4AwBo';

// Включить опрос сервера
let bot = new TelegramBot(token, {polling: true});

let questions = [
  {
    title:'Первый Вопрос',
    buttons: [
      [{ text: 'Первый Вопрос', callback_data: '0_1' }],
    ],
  },
  {
    title:'Второй Вопрос',
    buttons: [
      [{ text: 'Второй Вопрос', callback_data: '1_1' }],
    ],
  },
  {
    title:'Третий Вопрос',
    buttons: [
      [{ text: 'Третий Вопрос', callback_data: '2_1' }],
    ],
  },
];

function getRandomQuestion(){
  return questions[Math.floor(Math.random()*questions.length)];
}

function newQuestion(msg){
  let arr = getRandomQuestion();
  let text = arr.title;
  let options = {
    reply_markup: JSON.stringify({
      inline_keyboard: arr.buttons,
      parse_mode: 'Markdown'
    })
  };
  chat = msg.hasOwnProperty('chat') ? "@channeltest0007" : msg.from.id;
  bot.sendMessage(chat, text, options);
}

bot.onText(/\/start_test/, function (msg, match) {
  newQuestion(msg);
});

bot.on('callback_query', function (msg) {
  var answer = msg.data.split('_');
  var index = answer[0];
  var button = answer[1];
  console.log(msg.from)
  // if (questions[index].right_answer==button) {
  //
  //   bot.sendMessage(msg.from.id, 'Ответ верный ✅');
  // } else {
  //   bot.sendMessage(msg.from.id, 'Ответ неверный ❌');
  // }

  bot.answerCallbackQuery(msg.id, 'Вы выбрали: '+ msg.data, true);
  newQuestion(msg);
});


// const {Scenes, session, Telegraf} = require('telegraf');
//
// require('dotenv').config()
//
// const bot = new Telegraf('5333642362:AAHWgFsRXBTFyfnHj6vvZFXJTY8mTt4AwBo')
// // const index = new Telegraf(process.env.TOKEN)
//
//
// const SceneGenerator = require('./src/scene')
// const mongodb = require("./db");
// const curScene = new SceneGenerator()
//
//
// const stage = new Scenes.Stage([curScene.GenTextScene(), curScene.GenDateScene(), curScene.GenPublishScene(),])
//
// bot.use(session())
// bot.use(stage.middleware())
//
// bot.start(async (ctx) => {
//   // await ctx.scene.enter('text')
//   console.log(curScene.GenPublishScene.buttons)
// })
//
//
// bot.launch().then()

