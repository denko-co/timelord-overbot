const Discord = require('discord.js');
const axios = require('axios');
const moment = require('moment-timezone');
const bot = new Discord.Client({ autoReconnect: true });
const credentials = require('./credentials.json');
const TZdata = require('./data.json');
const WEATHER_API = 'http://api.openweathermap.org/data/2.5/weather';
bot.login(process.env.TOKEN || credentials.DISCORD_TOKEN);

bot.on('ready', function (event) {
  console.log('Logged in as %s - %s\n', bot.user.username, bot.user.id);
});

bot.on('message', async function (message) {
  const command = validate(message);
  if (!command) return;
  command.shift(); // Strip mention from command
  console.log(`command = [${command}]`);

  const arg = command.shift();
  let response = '';

  switch (arg) {
    case 'info':
      response = await getTZInfo(command);
      break;
    default:
  }

  console.log(response);
  if (response) message.channel.send(response);
});

function validate (message) {
  if (message.author.bot) return; // Ignore self

  const originalCommand = message.content.match(/[^\s"]+|"(?:[^"\\]|\\")*"/g) || []; // Help servers are useless
  const command = originalCommand.map(str => {
    // Unescape quotes in the string target if it's a quoted string and trim the start and end quotes
    if (str.charAt(0) === '"' && str.charAt(str.length - 1) === '"' && str.length > 1) {
      str = str.substring(1, str.length - 1).trim().replace(/\\"/g, '"');
    }
    return str;
  });
  if (getUserFromMention(command[0]) !== bot.user.id) return;

  return command;
}

async function getTZInfo (args) {
  console.log(`Timezone info called with ["${args}"]`);
  const matchedZone = TZdata.zones.find(zone => zone.aliases.includes(args[0].toLowerCase()));
  if (matchedZone) {
    const embed = new Discord.RichEmbed()
      .setTitle(matchedZone.name)
      .setThumbnail(matchedZone.flag);
    const imageInfo = matchedZone.images[Math.floor(Math.random() * matchedZone.images.length)];
    embed.setDescription(`*Pictured:* ${imageInfo.description}`);
    embed.setImage(imageInfo.image);
    for (let i = 0; i < matchedZone.locations.length; i++) {
      const currentLocation = matchedZone.locations[i];
      try {
        const response = await axios.get(WEATHER_API, {
          params: {
            id: currentLocation.city_id,
            APPID: credentials.WEATHER_API_KEY
          }
        });
        const data = response.data;
        console.log(data);
        embed.addField(currentLocation.name,
          `**Weather:** ${data.weather[0].description}
          **Temperature:** ${k2c(data.main.temp)}°C | ${k2f(data.main.temp)}°F
          **Time:** ${moment().tz(currentLocation.timezone).format('dddd, MMMM Do YYYY, h:mma')}`
        );
      } catch (err) {
        console.log(err);
      }
    }
    return embed;
  }
}

function k2c (kelvin) {
  return Math.round(kelvin - 273.15);
}

function k2f (kelvin) {
  return Math.round(kelvin * 9 / 5 - 459.67);
}

function getUserFromMention (mention) {
  return mention.replace(/[<@!>]/g, '');
}
