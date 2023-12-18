const { Events, ActivityType } = require('discord.js');
const { AutoPoster } = require('topgg-autoposter');
const { MongoClient } = require('mongodb');

const mongoURI = `${process.env.MONGODB_URI}`;
const mongoClient = new MongoClient(mongoURI);

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
		console.log(`${client.user.tag} is ready to chat!`);
    await connectToMongoDB();

		const poster = AutoPoster(process.env.TOPGG_TOKEN, client);

    poster.on('posted', (stats) => {
      console.log(`Posted stats to Top.gg | ${stats.serverCount} servers`);
    });

    let totalUsers = 0;

    await client.guilds.cache.forEach((guild) => {
      totalUsers += guild.memberCount;
    });

    client.user.setActivity({
      type: ActivityType.Custom,
      name: `Chatting with ${totalUsers.toLocaleString()} users.`,
    });
	},
};