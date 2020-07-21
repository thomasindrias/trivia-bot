require('dotenv').config();
const he = require('he');
const axios = require('axios').default;
const Discord = require('discord.js');
const bot = new Discord.Client();

var PREFIX = '!';

bot.on('ready', () => {
  console.log('Game Host online');
});

class Question {
  constructor(question, category, answers, correct_answer, img) {
    this.question = question;
    this.category = category;
    this.answers = answers;
    this.correct_answer = correct_answer;
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
    this.questions = [];
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

  formatDBToQuestions(questions) {
    questions.forEach(question => {

      var index = Math.floor(Math.random() * 4) + 0;
      var order = "ABCD";
      var choices = question.incorrect_answers;
      choices.splice(index, 0, question.correct_answer);

      var answers = {
        'A': he.decode(choices[0]),
        'B': he.decode(choices[1]),
        'C': he.decode(choices[2]),
        'D': he.decode(choices[3])
      }

      this.questions.push(new Question(he.decode(question.question), he.decode(question.category), answers, order.charAt(index)));
    });
  }

  async buildQuestions() {
    let easy = 'https://opentdb.com/api.php?amount=2&difficulty=easy&type=multiple';
    let medium = 'https://opentdb.com/api.php?amount=4&difficulty=medium&type=multiple';
    let hard = 'https://opentdb.com/api.php?amount=4&difficulty=hard&type=multiple';

    const req1 = axios.get(easy);
    const req2 = axios.get(medium);
    const req3 = axios.get(hard);

    await axios.all([req1, req2, req3]).then(axios.spread((...responses) => {
      const responseOne = responses[0].data.results;
      const responseTwo = responses[1].data.results;
      const responseThree = responses[2].data.results;

      let db = responseOne.concat(responseTwo).concat(responseThree);

      this.formatDBToQuestions(db);
      // use/access the results 
    })).catch(console.log());

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

  async start(message) {
    this.buildQuestions();

    this.channel.send('**Välkomna till Thomas game show!**\nJag är er underbara spelvärd eller ja... spelbot men är minst lika charmig som en människa! 😄');
    this.channel.send('Det kommer gå till på ungefär samma sätt som "the millionaire" men med flera spelare såklart! Ni kommer få flervalsfrågor i denna kanalen.\nNär ni får frågan så ska alla svara genom DM. Alla spelare kommer få ett litet meddelande från mig i privat chatt, där ska alla svara på frågorna i form av *A, B, C eller D*.');
    this.channel.send('När **alla** har svarat på en fråga så kommer jag visa svaret och sammanställa poäng!');

    this.channel.send('*Är ni redo? (svara **ja**)*');

    // eslint-disable-next-line no-case-declarations
    let filter = msg => msg.author.id == message.author.id &&
      msg.content.toLowerCase() == 'ja' &&
      trivia.players.find(player => player.id === message.author.id).vip;

    await message.channel.awaitMessages(filter, {
      max: 1,
      time: 20000
    }).then(() => {
      this.channel.send("***Då börjar vi!***")
    }).catch(console.log());

    //Game State 
    this.questions.forEach(question => {
      // 1. send out question number etc on DM for all players

      // 2. receive answer from DM for all players

      // 3. check correct answer and give points for all players

      // 5. reveal answer on channel.
    });
  }
}


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
  if (message.channel.id === trivia.channel.id) {
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
            trivia.start(message);
          }).catch(console.log());
        } else message.reply('Spelet har redan startat!')

        break;

      default:
        break;
    }
  }
});

bot.login(process.env.DISCORD_TOKEN);