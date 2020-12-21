const ytdl = require('ytdl-core');
const yts = require('yt-search');

// can remove if container wont die off every once in a while when there are no requests
const https = require('https');

const playSong = (message, song, serverData) => {
  if (!song) {
    serverData.delete(message.guild.id);
    return message.channel.send('Cannot find this song!');
  }
  const currentServerData = serverData.get(message.guild.id);
  const dispatcher = currentServerData
    .connection
    .play(ytdl(song.url))
    .on('start', () => {
      // can remove if container wont die off every once in a while when there are no requests
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log('Making the periodic API call to Health URL');
        https.get('https://thawing-cliffs-08354.herokuapp.com/', (resp) => {
          let data = '';

          // A chunk of data has been recieved.
          resp.on('data', (chunk) => {
            data += chunk;
          });

          // The whole response has been received. Print out the result.
          resp.on('end', () => {
            // eslint-disable-next-line no-console
            console.log(JSON.parse(data).explanation);
          });
        }).on('error', (err) => {
          // eslint-disable-next-line no-console
          console.log(`Error: ${err.message}`);
        });
      }, 60000);
    })
    .on('finish', () => {
      currentServerData.songs.shift();
      if (currentServerData.songs.length > 0) {
        playSong(message, currentServerData.songs[0], serverData);
      }
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

const addToPlaylist = async (message, args, currentServerData, serverData, isUrl) => {
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) { return message.channel.send('Mundam! You need to be in a voice channel!'); }

  const permissions = voiceChannel.permissionsFor(message.client.user);

  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.channel.send('Pesa permission tharanum da dei');
  }

  let songInfo;
  let song;

  if (isUrl) {
    songInfo = await ytdl.getInfo(args);
    song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };
  } else {
    songInfo = await yts(args);
    const trimmedSongs = songInfo.videos.slice(0, 1);
    song = {
      title: trimmedSongs[0].title,
      url: trimmedSongs[0].url,
    };
  }

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
      playSong(message, queueContruct.songs[0], serverData);
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

const isUrlString = (args) => {
  const regexPattern = new RegExp('^(https?:\\/\\/)?' // protocol
    + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
    + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
    + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
    + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
    + '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!regexPattern.test(args);
};

module.exports = {
  play: playSong,
  stop,
  skip,
  addToPlaylist,
  isUrlString,
};
