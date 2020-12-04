const ytdl = require('ytdl-core');
const yts = require('yt-search');

const play = (message, song, serverData) => {
  if (!song) {
    serverData.delete(message.guild.id);
    return message.channel.send('Cannot find this song!');
  }
  const currentServerData = serverData.get(message.guild.id);
  const dispatcher = currentServerData
    .connection
    .play(ytdl(song.url))
    .on('finish', () => {
      currentServerData.songs.shift();
    })
    .on('error', (error) => /* eslint-disable-line no-console */console.error(error));

  dispatcher.setVolumeLogarithmic(currentServerData.volume / 5);
  currentServerData.textChannel.send(`Playing now: **${song.title}**`);
  return null;
};

const stop = (message, currentServerData) => {
  if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel to stop the music!');
  if (!currentServerData) return message.channel.send('No songs are currently playing!');

  // eslint-disable-next-line no-param-reassign
  currentServerData.songs = [];
  currentServerData.connection.dispatcher.end();
  currentServerData.voiceChannel.leave();
  return null;
};

const skip = (message, currentServerData) => {
  if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel to stop the music!');
  if (!currentServerData) return message.channel.send('There is no song that I could skip!');
  currentServerData.songs.shift();
  currentServerData.connection.dispatcher.end();
  return null;
};

const addToPlaylist = async (message, args, currentServerData, serverData) => {
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) { return message.channel.send('Mundam! You need to be in a voice channel!'); }

  const permissions = voiceChannel.permissionsFor(message.client.user);

  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.channel.send('Pesa permission tharanum da dei');
  }

  const songInfo = await yts(args);
  const trimmedSongs = songInfo.videos.slice(0, 1);
  const song = {
    title: trimmedSongs[0].title,
    url: trimmedSongs[0].url,
  };

  if (!currentServerData) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    // Pushing the song to our songs array
    queueContruct.songs.push(song);

    // Setting the serverData using our contract
    serverData.set(message.guild.id, queueContruct);

    try {
      // Here we try to join the voicechat and save our connection into our object.
      const connection = await voiceChannel.join();
      queueContruct.connection = connection;
      // Calling the play function to start a song
      play(message, queueContruct.songs[0], serverData);
    } catch (err) {
      // Printing the error message if the bot fails to join the voicechat
      // eslint-disable-next-line no-console
      console.log('Error joining voice chat: ', err);
      serverData.delete(message.guild.id);
      return message.channel.send('Error joining voice chat');
    }
  } else {
    currentServerData.songs.push(song);
    return message.channel.send(`${song.title} has been added to the playlist!`);
  }

  return null;
};

module.exports = {
  play,
  stop,
  skip,
  addToPlaylist,
};
