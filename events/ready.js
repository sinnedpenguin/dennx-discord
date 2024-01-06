const { Events, ActivityType } = require('discord.js');
const { AutoPoster } = require('topgg-autoposter');
const { MongoClient } = require('mongodb');
const express = require('express'); 

const mongoURI = `${process.env.MONGODB_URI}`;
const mongoClient = new MongoClient(mongoURI);

const app = express(); 
const port = 3001;

async function connectToMongoDB() {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`${client.user.tag} is now online.`);
    await connectToMongoDB();

		const poster = AutoPoster(process.env.TOPGG_TOKEN, client);

    poster.on('posted', (stats) => {
      console.log(`Posted stats to Top.gg | ${stats.serverCount} servers.`);
    });

    let totalUsers = 0;

    await client.guilds.cache.forEach((guild) => {
      totalUsers += guild.memberCount;
    });

    let activities = [
      { type: ActivityType.Watching, name: () => `${client.guilds.cache.size.toLocaleString()} servers.` },
      { type: ActivityType.Custom, name: () => `Chatting with ${totalUsers.toLocaleString()} users.` },
    ];
    let i = 0;

    setInterval(() => {
      let activity = activities[i++ % activities.length];
      client.user.setActivity({
        type: activity.type,
        name: typeof activity.name === 'function' ? activity.name() : activity.name
      });
    }, 60 * 1000); 

    app.get('/dennxServerCount', (req, res) => {
      res.send({ serverCount: client.guilds.cache.size });
    });

    app.listen(port, () => {
      console.log(`Server is listening at http://localhost:${port}`);
    });
	},
};
