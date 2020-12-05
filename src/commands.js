module.exports = {
  PING: {
    name: 'ping',
    desc: 'A basic ping command to check if the server is up!',
    usage: '!ping',
  },
  PLAY: {
    name: 'play',
    desc: 'Plays a song of your choice. Arguments can be a URL or a search query',
    usage: '!play enga area ulla varada \n !play https://www.youtube.com/watch?v=F586JktJyEg&list=RDF586JktJyEg&start_radio=1',
  },
  STOP: {
    name: 'stop',
    desc: 'Stops playing the song and disconnects from the server',
    usage: '!stop',
  },
  SKIP: {
    name: 'skip',
    desc: 'Skips the song currently playing and plays the next',
    usage: '!skip',
  },
  PLAYLIST: {
    name: 'playlist',
    desc: 'Shows the songs which are queued in the playlist!',
    usage: '!playlist',
  },
  HELP: {
    name: 'help',
    desc: 'Displays list of all available commands from Euphony',
    usage: '!help',
  },
};
