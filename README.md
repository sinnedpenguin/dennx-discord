# DennX - Discord Bot

A Discord AI chatbot powered by Google's Gemini Pro.

[Invite to your server](https://discord.com/oauth2/authorize?client_id=1175486521659363328&permissions=3072&scope=bot%20applications.commands)

![Screenshot 2024-01-13 140035](https://github.com/sinnedpenguin/dennx-discord/assets/133164950/af81241a-2a82-4a5c-9e78-1653c4137e73)

## Prerequisites

- Discord Bot Token
- Discord Bot Application ID
- Top.gg Token (Optional. The bot is currently in Top.gg and some commands are restricted to voters. Can be removed. Check `a.js`, `c.js`, and `ready.js`)
- Gemini Pro API Key
- MongoDB

**1. Clone the repository:**
```shell
git clone https://github.com/sinnedpenguin/dennx-discord
```

**2. Install dependencies:**
```shell
cd dennx-discord
npm install
```

**3. Create a .env file following the .env.example:**
```shell
BOT_TOKEN=
CLIENT_ID=
TOPGG_TOKEN=

API_KEY=
CHAT_MODEL=gemini-pro
MONGODB_URI=
```

**4. Run the app:**
```shell
node index.js
```

## License

Licensed under the [MIT License](LICENSE).
