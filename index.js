const Discord = require('discord.js');
const bot = new Discord.Client({ autoReconnect: true });
const credentials = require('./credentials.json');
const TZdata = require('./data.json');


bot.login(process.env.TOKEN || credentials.discordToken);

bot.on('ready', function (event) {
  console.log('Logged in as %s - %s\n', bot.user.username, bot.user.id);
});

bot.on('message', function (message) {
  command = validate(message)
  if (!command) return;
  command.shift(); // Strip mention from command
  console.log("command = [" + command + "]")

  arg = command.shift()
  switch (arg) {
    case "time":
      response = getTZInfo(command)
      break;
    default:
      response = "";
  }

  if (response) message.channel.send(response);
});

function validate(message) {
  if (message.author.bot) return; // Ignore self

  let originalCommand = message.content.match(/[^\s"]+|"(?:[^"\\]|\\")*"/g) || []; // Help servers are useless
  let command = originalCommand.map(str => {
    // Unescape quotes in the string target if it's a quoted string and trim the start and end quotes
    if (str.charAt(0) === '"' && str.charAt(str.length - 1) === '"' && str.length > 1) {
      str = str.substring(1, str.length - 1).trim().replace(/\\"/g, '"');
    }
    return str;
  });
  if (command[0] !== bot.user.toString()) return;

  return command
}

function getTZInfo(args) {
  console.log("Timezone info called with [" + args + "]")
  TZdata.zones.forEach(function (zone) {
    console.log(zone)
  });
}
