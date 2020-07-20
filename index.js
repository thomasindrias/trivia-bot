const Discord = require('discord.js');
const bot = new Discord.Client();

const token = 'NzM0MDQzMDQwNTgyNDY3Njk0.XxL_Hw.jC3N3ytrwr2OAfCqZc2Z7xNffhc';

var PREFIX = '!';

bot.on('ready', () => {
  console.log('Game Host online');
});

class Question {
  constructor(question, answers, img) {
    this.question = question;
    this.answers = answers;
    this.img = img;
  }

  //Print out question
  print() {}

}

class Player {
  constructor(id, points) {
    this.id = id;
    this.points = points;
    this.vip = false;
  }
}

class Trivia {
  constructor() {
    this.round = 0;
    this.channel = null;
    this.players = [];
    this.questions = null;
  }

  main() {
    this.scoreboard();
  }

  scoreboard() {
    this.players.sort((a, b) => {
      return a.points - b.points;
    });

    this.players.forEach(player => {
      const userID = `<@${player.id}>`;
      this.channel.send(userID + ' har ' + player.points + ' poäng');
    });
  }

  async confirmation(message) {
    message.reply('Är du säker? Isåfall skriv **ja**');

    let filter = msg => msg.author.id == message.author.id &&
      msg.content.toLowerCase() == 'ja' &&
      this.players.find(player => player.id === message.author.id).vip;

    await message.channel.awaitMessages(filter, {
      max: 1,
      time: 20000
    }).then(() => {
      return true;
    }).catch(console.log());

    return false;
  }

  init() {
    this.channel.send('**Välkommen till thomas underbara trivia!**');
    this.channel.send('Skriv **join** för att delta!');
  }

  initPlayers(message) {
    const userID = message.author.id;
    console.log(userID + ' joining');

    if (!this.players.find(player => player.id === userID)) {
      this.players.push(new Player(userID, 0));

      //if first player joins make vip
      if (this.players.length == 1) {
        this.players[0].vip = true;
        message.reply('deltar spelet och är VIP.');
      } else message.reply('deltar spelet.');
    } else message.reply('är redan med i spelet.');
  }

  start() {
    this.channel.send('Startar Thomas game show..');
  }
}



//Auxillary funcs
/*
const filter = (reaction, user) => reaction.emoji.name === '👌' && user.id === message.author.id;
const collector = message.createReactionCollector(filter, {
  time: 10000
});

collector.on('collect', (reaction, user) => {
  console.log(`${user.tag} reacted with ${reaction.emoji.name}.`);
});

*/

let trivia = new Trivia()
const name = 'thomas-underbara-trivia';
var game_state, channel;

bot.on('message', message => {
  let args = message.content.substring(PREFIX.length).split(" ");
  channel = message.guild.channels.cache.find(channel => channel.name === name);

  if (args[0] === "trivia")
    switch (args[1]) {
      case 'skapa':

        if (!channel) {
          console.log('creating new channel..');

          message.guild.channels.create(name, {
              type: 'text'
            })
            .then(channel => {
              console.log('starting trivia..');
              trivia.channel = channel;
              trivia.init();
              game_state = 'join';
            })
            .catch(error => {
              message.reply('Gick inte att skapa kanalen pga' + error + '.\n' + 'försök igen.');
            });
        } else {
          console.log('channel exists, starting trivia..');
          trivia.channel = channel;
          trivia.init();
          game_state = 'join';
        }
        break;
      case 'clear':
        if (!args[2]) return message.reply('Error, please type your option');
        message.channel.bulkDelete(args[2]);
        break;
    }

  switch (message.content) {
    case 'join':
      if (game_state === 'join')
        trivia.initPlayers(message);
      else message.reply('du kan inte joina för tillfället.');
      break;

    case 'start':
      if (game_state !== 'start') {
        message.reply('Är du säker? Isåfall skriv **ja**');

        // eslint-disable-next-line no-case-declarations
        let filter = msg => msg.author.id == message.author.id &&
          msg.content.toLowerCase() == 'ja' &&
          trivia.players.find(player => player.id === message.author.id).vip;

        message.channel.awaitMessages(filter, {
          max: 1,
          time: 20000
        }).then(() => {
          game_state = 'start';
          trivia.start();
        }).catch(console.log());
      } else message.reply('Spelet har redan startat!')

      break;

    default:
      break;
  }
});

bot.login(token);