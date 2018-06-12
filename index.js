const Command = require('command')
const tmi = require('tmi.js')
const config = require('./config.json')

const PRIVATE_CHANNEL_ID = -6 >>> 0
const PRIVATE_CHANNEL_NAME = 'Twitch'

module.exports = function TwitchChatRelay(dispatch) {
  const command = new Command(dispatch)

  let username = config.username
  let password = config.password
  let debug = config.debug || true
  let reconnect = config.reconnect || true
  let currentChannel = config.channel || `#${username}`

  if (!username || !password) {
    console.log('[twitch-chat-relay] If you want to use the relay, please enter your details in config.json')
    return
  }

  var options = {
    options: {
      debug: debug
    },
    connection: {
      reconnect: reconnect
    },
    identity: {
      username: username,
      password: password
    },
    channels: [currentChannel]
  }

  var client = new tmi.client(options)

  client.connect().then(function(data) {
    // notice(` -- Connected to ${currentChannel}`)
  }).catch(function(err) {
    console.log(err)
  })

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

  command.add('tw', (opt, arg1, arg2, arg3) => {
    switch (opt) {
      case 'channel':
        if (!arg1) {
          command.message('Please specify the channel you wish to join:')
          command.message('/8 tw ch [#channelname]')
          return
        }
        let newChannel = arg1
        if (newChannel == currentChannel) {
          command.message(`You're already on ${currentChannel}`)
          return
        }
        client.part(currentChannel).then(function(data) {
          notice(` -- You've left ${currentChannel}`)
        }).catch(function(err) {
          console.log(err)
        })
        client.join(newChannel).then(function(data) {
          notice(` -- You've joined ${newChannel}`)
        }).catch(function(err) {
          console.log(err)
        })
        currentChannel = newChannel
        break

      case 'ban':
        if (!arg1) {
          command.message('Please specify the user you wish to ban:')
          command.message('/8 tw ban [username] [reason]')
          command.message('Parameter [reason] is optional.')
          return
        }
        let banUser = arg1
        let banReason = arg2 || 'none'
        client.ban(currentChannel, banUser, banReason).then(function(data) {
          notice(` -- You've banned ${banUser} (Reason: ${banReason})`)
        }).catch(function(err) {
          console.log(err)
        })
        break

      case 'unban':
        if (!arg1) {
          command.message('Please specify the user you wish to unban:')
          command.message('/8 tw unban [username]')
          return
        }
        let unbanUser = arg1
        client.unban(currentChannel, unbanUser).then(function(data) {
          notice(` -- You've unbanned ${unbanUser}`)
        }).catch(function(err) {
          console.log(err)
        })
        break

      case 'timeout':
        if (!arg1) {
          command.message('Please specify the user you wish to timeout:')
          command.message('/8 tw timeout [username] [timer] [reason]')
          command.message('Parameters [timer] and [reason] are optional.')
          return
        }
        let timeoutUser = arg1
        let timer = arg2 || 300
        let timeoutReason = arg3 || 'none'
        client.timeout(currentChannel, timeoutUser, timer, timeoutReason).then(function(data) {
          notice(` -- You've timed out ${timeoutUser} for ${timer} seconds (Reason: ${timeoutReason})`)
        }).catch(function(err) {
          console.log(err)
        })
        break

      default:
        command.message(' Twitch Chat Relay for TERA Proxy. Usage:')
        command.message(' /6 or /twitch for chat')
        command.message(' /8 tw channel [#channel]')
        command.message(' /8 tw ban [user] [reason]')
        command.message(' /8 tw unban [user]')
        command.message(' /8 tw timeout [username] [timer] [reason]')
        break
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

  function notice(msg) {
    dispatch.send('S_CHAT', 2, {
      channel: 16,
      authorID: 0,
      unk1: 0,
      gm: 0,
      founder: 0,
      authorName: '',
      message: msg
    })
  }

  this.destructor = function() {
    command.remove('tw')
    if (client.readyState() == 'OPEN') client.disconnect()
    delete require.cache[require.resolve('./config.json')]
    delete require.cache[require.resolve('tmi.js')]
  }
}
