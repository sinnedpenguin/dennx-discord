const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');

const mongoURI = process.env.MONGODB_URI;
const mongoClient = new MongoClient(mongoURI);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear chat history.'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      await interaction.deferReply({ ephemeral: true });

      await mongoClient.connect();

      const collection = mongoClient.db().collection('chatHistory');

      const result = await collection.findOne({ guildId, userId });

      if (result) {
        await collection.deleteOne({ guildId, userId });

        const responseEmbed = new EmbedBuilder()
          .setDescription('Chat history cleared! You can start a new conversation with me. Just `/chat`!');

        await interaction.followUp({
          embeds: [responseEmbed]
        });
      } else {
        console.log('No chat history found for guild:', guildId, 'and user:', userId);

        const responseEmbed = new EmbedBuilder()
          .setDescription('No chat history found to clear.');

        await interaction.followUp({
          embeds: [responseEmbed]
        });
      }
    } catch (error) {
      console.error('An error occurred during the clear command:', error);

      const responseEmbed = new EmbedBuilder()
        .setDescription('An error occurred while trying to clear the chat history.');

      await interaction.followUp({
        embeds: [responseEmbed]
      });
    } finally {
      await mongoClient.close();
    }
  },
};
