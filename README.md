# twitch-chat-relay
A `tera-proxy module, that acts as a chat relay between Twitch and TERA. It connects your in game `/6` private chat to Twitch chat, so you can read/send messages and use chat actions from inside the game.

## Config
Open `config.json` and enter your details.
```json
{
  "username": "twitch_username",
  "password": "twitch_oauth_password",
  "channel": "#channel_to_join",
  "debug": true,
  "reconnect: true
}
```
You can generate OAuth password [here](https://twitchapps.com/tmi/), `channel` can be your own `#username`, or if you want to chat on someone else's stream, then their `#username`.

## Usage
Type `/6` or `/twitch` in game to activate the Twitch private channel. To use chat actions, you can either type `/6 !command` or `/8 command`. Available commands:
### `tw channel <#channelname>`
- Leave your current channel, and join `#channelname`
### `tw ban <user> <reason>`
- Ban `user` from the chat
- `reason` is optional, needs to be quoted if it contains any whitespace
### `tw unban <user>`
- Unban `user` from the chat
### `tw timeout <user> <timer> <reason>`
- Timeout `user` from the chat for `timer` seconds
- `timer` is optional, default is 300 seconds
- `reason` is optional, needs to be quoted if it contains any whitespace

## Credits
- Thanks to [Pinkie Pie](https://github.com/pinkipi/) for the private channel code
