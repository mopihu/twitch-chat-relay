![](https://tera.zone/twitchrelay.gif)
# twitch-chat-relay
A `tera-proxy` module, that acts as a chat relay between Twitch and TERA. It connects your in game `/6` private chat to Twitch chat, so you can read/send messages and use chat actions from inside the game.

## Config
You can either `/8 tw` to open settings UI, or edit `config.json` and enter your details.
```json
{
  "version": 1,
  "data": {
    "username": "twitch_username",
    "password": "twitch_oauth_password",
    "channel": "#channel_to_join",
    "debug": true,
    "reconnect": true
  }
}
```
You can generate OAuth password [here](https://twitchapps.com/tmi/), `channel` can be your own `#username`, or if you want to chat on someone else's stream, then their `#username`.

## Usage
Type `/6` or `/twitch` in game to activate the Twitch private channel. To use chat actions, you can either type `/6 !command` or `/8 command`. Available commands:
### `tw action <action message>`
- Send action message
### `tw ban <user> <reason>`
- Ban `user` from the chat
- `reason` is optional
### `tw clear`
- Clear all chat messages
### `tw channel <#channelname>`
- Leave your current channel, and join `#channelname`
### `tw color <color>`
- Change chat name color
### `tw connect`
- Connect to Twitch chat manually
### `tw disconnect`
- Disconnect from Twitch chat manually
### `tw host <channel>`
- Host `channel`
### `tw timeout <user> <timer> <reason>`
- Timeout `user` from the chat for `timer` seconds
- `timer` is optional, default is 300 seconds
- `reason` is optional
### `tw unban <user>`
- Unban `user` from the chat
### `tw unhost <channel>`
- Unhost `channel`
### `tw whisper <user> <your message>`
- Whisper `user` with `your message`

## Credits
- Thanks to [Pinkie Pie](https://github.com/pinkipi/) for the private channel code
