const Discord = require('discord.js');

const { PREFIX, BOT_TOKEN } = require('./config');
const commands = require('./commands');

const {
  PING, PLAY, STOP, SKIP, PLAYLIST, HELP,
} = commands;

const {
  play, stop, skip, addToPlaylist,
} = require('./operations');

const client = new Discord.Client();

client.login(BOT_TOKEN);

const serverData = new Map();

client.on('message', (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith(PREFIX)) return;

  const commandBody = message.content.slice(PREFIX.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();
  const currentServerData = serverData.get(message.guild.id);

  if (command === PING.name) {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
  }

  if (command === PLAY.name) {
    const playArgs = args.reduce((acc, currVal) => `${acc} ${currVal}`);
    addToPlaylist(message, playArgs, currentServerData, serverData);
  }

  if (command === STOP.name) {
    stop(message, currentServerData);
  }

  if (command === SKIP.name) {
    skip(message, currentServerData);
    play(message, currentServerData.songs[0], serverData);
  }

  if (command === PLAYLIST.name) {
    if (currentServerData.songs.length === 0) {
      message.reply('Playlist is empty! Use !play command to add more songs to the playlist queue');
      return;
    }
    let playlistString = '\n';
    currentServerData.songs.forEach((songObj, index) => {
      playlistString += `${index + 1}. ${songObj.title}\n`;
    });
    message.reply(`Playlist - ${playlistString}`);
  }

  if (command === HELP.name) {
    let commandsString = '\n';
    Object.keys(commands).forEach((commandObj, index) => {
      const localCommand = commands[commandObj];
      commandsString += (`${index + 1}. ${localCommand.name.toUpperCase()}\n Description: ${localCommand.desc} \n Usage: ${localCommand.usage} \n`);
    });
    message.reply(commandsString);
  }
});
