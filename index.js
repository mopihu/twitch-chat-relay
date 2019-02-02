const tmi = require('tmi.js');
const config = require('./config.json');

const PRIVATE_CHANNEL_ID = -6 >>> 0;
const PRIVATE_CHANNEL_NAME = 'Twitch';
const AVAILABLE_COLORS = ['Blue', 'BlueViolet', 'CadetBlue', 'Chocolate', 'Coral', 'DodgerBlue', 'Firebrick', 'GoldenRod', 'Green', 'HotPink', 'OrangeRed', 'Red', 'SeaGreen', 'SpringGreen', 'YellowGreen'];

module.exports = function TwitchChatRelay(mod) {
  let username = config.username;
  let password = config.password;
  let debug = config.debug || true;
  let reconnect = config.reconnect || true;
  let currentChannel = config.channel || `#${username}`;

  if (!username || !password) {
    mod.log('If you want to use the relay, please enter your details in config.json!');
    return;
  }

  const options = {
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
  };

  const client = new tmi.client(options);

  client.on('chat', function (channel, userstate, message, self) {
    msg(message, userstate['username']);
  });

  client.on('action', function (channel, userstate, message, self) {
    msg(` ${userstate['username']} ${message}`);
  });

  mod.hook('S_LOAD_CLIENT_USER_SETTING', 'raw', () => {
    process.nextTick(() => {
      join();
      connect();
    });
  });

  mod.hook('S_JOIN_PRIVATE_CHANNEL', 1, event =>
    event.index === 5 ? false : undefined
  );
  mod.hook('C_LEAVE_PRIVATE_CHANNEL', 1, event =>
    event.index === 5 ? false : undefined
  );

  mod.hook('C_REQUEST_PRIVATE_CHANNEL_INFO', 1, event => {
    if (event.channelId == PRIVATE_CHANNEL_ID) {
      mod.send('S_REQUEST_PRIVATE_CHANNEL_INFO', 1, {
        owner: 1,
        password: 0,
        members: [],
        friends: []
      });
      return false;
    }
  });

  mod.hook('C_CHAT', 1, event => {
    if (event.channel == 16) {
      if (client.readyState() == 'OPEN') {
        client.say(currentChannel, event.message.replace(/<[^>]*>/g, ''));
      } else {
        mod.command.message('You are not connected to Twitch.');
        mod.command.message(' /8 tw connect');
      }
      return false;
    }
  });

  mod.hook('S_RETURN_TO_LOBBY', 'raw', () => {
    disconnect();
  });

  mod.command.add(['tw','twitch'], {
    $default() {
      mod.command.message('Twitch Chat Relay for TERA Proxy. Usage:');
      mod.command.message('/6 or /twitch for chat');
      mod.command.message('/8 tw action [message]');
      mod.command.message('/8 tw ban [user] [reason]');
      mod.command.message('/8 tw clear');
      mod.command.message('/8 tw channel [channel]');
      mod.command.message('/8 tw connect');
      mod.command.message('/8 tw disconnect');
      mod.command.message('/8 tw host [channel]');
      mod.command.message('/8 tw timeout [username] [timer] ["ban reason"]');
      mod.command.message('/8 tw unban [username]');
      mod.command.message('/8 tw unhost');
      mod.command.message('/8 tw whisper [username] ["your message"]');
    },
    action(...args) {
      if (!args[0]) {
        mod.command.message('Please specify the action message you wish to send:');
        mod.command.message('/8 tw action [your action message]');
        return;
      }
      let message = args.join(' ');
      client
      .action(currentChannel, message)
      .then(function(data) {
        // msg(` -- You've sent an action message`);
      })
      .catch(function(err) {
        mod.error(err);
      });
    },
    ban(...args) {
      if (!args[0]) {
        mod.command.message('Please specify the user you wish to ban:');
        mod.command.message('/8 tw ban [username] [reason]');
        mod.command.message('Parameter [reason] is optional.');
        return;
      }
      let banUser = args[0];
      let banReason = args[1] || 'none';
      client
        .ban(currentChannel, banUser, banReason)
        .then(function(data) {
          msg(` -- You've banned ${banUser} (Reason: ${banReason})`);
        })
        .catch(function(err) {
          mod.error(err);
        });
    },
    clear() {
      client.clear(currentChannel)
        .then(function(data) {
          msg(` -- You've cleared all messages on #${currentChannel})`);
        })
        .catch(function(err) {
          mod.error(err);
        });
    },
    channel(...args) {
      if (!args[0]) {
        mod.command.message('Please specify the channel you wish to join:');
        mod.command.message('/8 tw channel [#channelname]');
        return;
      }
      let newChannel = args[0];
      if (newChannel == currentChannel) {
        mod.command.message(`You're already on ${currentChannel}`);
        return;
      }
      if (!newChannel.startsWith('#')) newChannel = `#${newChannel}`;
      client
        .part(currentChannel)
        .then(function(data) {
          msg(` -- You've left ${currentChannel}`);
          currentChannel = null;
        })
        .catch(function(err) {
          mod.error(err);
        });
      client
        .join(newChannel)
        .then(function(data) {
          msg(` -- You've joined ${newChannel}`);
          currentChannel = newChannel;
        })
        .catch(function(err) {
          mod.error(err);
        });
    },
    color(clr) {
      if (!clr) {
        mod.command.message('Please specify the color you wish to use:');
        mod.command.message('/8 tw color [color]');
        return;
      }
      if (!AVAILABLE_COLORS.includes(clr)) {
        mod.command.message(`Available colors: ${AVAILABLE_COLORS.join(', ')}`);
        return;
      }
      client
        .color(clr)
        .then(function(data) {
          msg(` -- You've changed your color to ${clr}`);
        })
        .catch(function(err) {
          mod.error(err);
        });
    },
    connect() {
      connect();
    },
    disconnect() {
      disconnect();
    },
    host(...args) {
      if (!args[0]) {
        mod.command.message('Please specify the channel you wish to host:');
        mod.command.message('/8 tw host [channel]');
        return;
      }
      let hostChannel = args[0];
      client
        .host(currentChannel, hostChannel)
        .then(function(data) {
          msg(` -- You are now hosting ${hostChannel}`);
        })
        .catch(function(err) {
          mod.error(err);
        });
    },
    timeout(...args) {
      if (!args[0]) {
        mod.command.message('Please specify the user you wish to timeout:');
        mod.command.message('/8 tw timeout [username] [timer] [reason]');
        mod.command.message('Parameters [timer] and [reason] are optional.');
        return;
      }
      let timeoutUser = args[0];
      let timer = args[1] || 300;
      let timeoutReason = args[2] || 'none';
      client
        .timeout(currentChannel, timeoutUser, timer, timeoutReason)
        .then(function(data) {
          msg(` -- You've timed out ${timeoutUser} for ${timer} seconds (Reason: ${timeoutReason})`);
        })
        .catch(function(err) {
          mod.error(err);
        });
    },
    unban(...args) {
      if (!args[0]) {
        mod.command.message('Please specify the user you wish to unban:');
        mod.command.message('/8 tw unban [username]');
        return;
      }
      let unbanUser = args[0];
      client
        .unban(currentChannel, unbanUser)
        .then(function(data) {
          msg(` -- You've unbanned ${unbanUser}`);
        })
        .catch(function(err) {
          mod.error(err);
        });
    },
    unhost() {
      client
        .unhost(currentChannel)
        .then(function(data) {
          msg(` -- You've stopped hosting`);
        })
        .catch(function(err) {
          mod.error(err);
        });
    },
    whisper(...args) {
      if (!args[1]) {
        mod.command.message('Please specify the user and message you wish to whisper:');
        mod.command.message('/8 tw whisper [username] ["your message"]');
      }
      let whisperUser = args[0];
      let whisperMsg = args[1];
      client.whisper(whisperUser, whisperMsg)
        .then(function(data) {
          msg(` -- You've whispered ${whisperUser}`);
        })
        .catch(function(err) {
          mod.error(err);
        });
    },
    $none() {
      //
    }
  });

  function join() {
    mod.send('S_JOIN_PRIVATE_CHANNEL', 1, {
      index: 5,
      id: PRIVATE_CHANNEL_ID,
      unk: [],
      name: PRIVATE_CHANNEL_NAME
    });
  }

  function connect() {
    if (client.readyState() == 'OPEN') return;
    client
      .connect()
      .then(function(data) {
        msg(` -- Connected to ${currentChannel}`);
      })
      .catch(function(err) {
        mod.error(err);
      });
  }

  function disconnect() {
    if (client.readyState() == 'CLOSED') return;
    client
      .disconnect()
      .then(function(data) {
        msg(` -- Disconnected from ${currentChannel}`);
      })
      .catch(function(err) {
        mod.error(err);
      });
  }

  function msg(msg, author) {
    mod.send('S_CHAT', 2, {
      channel: 16,
      authorID: 0,
      unk1: 0,
      gm: 0,
      founder: 0,
      authorName: author,
      message: msg
    });
  }

  this.destructor = function() {
    disconnect();
    mod.command.remove(['tw','twitch']);
    delete require.cache[require.resolve('./config.json')];
    delete require.cache[require.resolve('tmi.js')];
  };
};
