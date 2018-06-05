const Command = require('command')
const tmi = require('tmi.js')
const config = require('./config.json')

const PRIVATE_CHANNEL_ID = -6 >>> 0
const PRIVATE_CHANNEL_NAME = `Twitch`                                     

module.exports = function TwitchChatRelay(dispatch) {
  const command = new Command(dispatch)

  let username = config.username
  let password = config.password
  let currentChannel = config.channel

  if (!username || !password || !currentChannel) {
    console.log('[twitch-chat-relay] Please enter your details in config.json')
    return
  }

  var options = {
    options: {
      debug: true
    },
    connection: {
      reconnect: true
    },
    identity: {
      username: username,
      password: password
    },
    channels: [currentChannel]
  }

  var client = new tmi.client(options)

  client.connect()

  client.on('chat', function(channel, userstate, message, self) {
    chat(userstate['username'], message)
  })

  dispatch.hook('S_LOAD_CLIENT_USER_SETTING', 'raw', () => {
    process.nextTick(() => {
      join()
    })
  })

  dispatch.hook('S_JOIN_PRIVATE_CHANNEL', 1, event => event.index === 5 ? false : undefined)
  dispatch.hook('C_LEAVE_PRIVATE_CHANNEL', 1, event => event.index === 5 ? false : undefined)

  dispatch.hook('C_REQUEST_PRIVATE_CHANNEL_INFO', 1, event => {
    if (event.channelId == PRIVATE_CHANNEL_ID) {
      dispatch.send('S_REQUEST_PRIVATE_CHANNEL_INFO', 1, {
        owner: 1,
        password: 0,
        members: [],
        friends: []
      })
      return false
    }
  })

  dispatch.hook('C_CHAT', 1, event => {
    if (event.channel == 16) {
      client.say(currentChannel, event.message.replace(/<[^>]*>/g, ''))
      return false
    }
  })

  function join() {
    dispatch.send('S_JOIN_PRIVATE_CHANNEL', 1, {
      index: 5,
      id: PRIVATE_CHANNEL_ID,
      unk: [],
      name: PRIVATE_CHANNEL_NAME
    })
  }

  function chat(author, msg) {
    dispatch.send('S_CHAT', 2, {
      channel: 16,
      authorID: 0,
      unk1: 0,
      gm: 0,
      founder: 0,
      authorName: author,
      message: msg
    })
  }
}
