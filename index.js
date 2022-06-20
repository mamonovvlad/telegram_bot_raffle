const {Scenes, session, Telegraf} = require('telegraf');

require('dotenv').config()

const index = new Telegraf('5333642362:AAHWgFsRXBTFyfnHj6vvZFXJTY8mTt4AwBo')
// const index = new Telegraf(process.env.TOKEN)


const SceneGenerator = require('./src/scene')
const mongodb = require("./db");
const curScene = new SceneGenerator()


const stage = new Scenes.Stage([curScene.GenTextScene(), curScene.GenDateScene(), curScene.GenPublishScene(),])

index.use(session())
index.use(stage.middleware())

index.start(async (ctx) => {
  await ctx.scene.enter('text')
})




index.launch().then()

