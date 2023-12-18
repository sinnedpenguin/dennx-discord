const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const fs = require('fs');

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
        const logInteraction = `${new Date().toLocaleString()}. ${guildId}/${userId}. /clear: Chat history cleared.\n`;
        fs.appendFileSync('logs.txt', logInteraction);

        await collection.deleteOne({ guildId, userId });

        const responseEmbed = new EmbedBuilder()
          .setDescription('Chat history cleared! You can start a new conversation with me. Just `/chat`!')
          .setTimestamp();

        await interaction.followUp({
          embeds: [responseEmbed]
        });
      } else {
        const logInteraction = `${new Date().toLocaleString()}. ${guildId}/${userId}. /clear: No chat history found.\n`;
        fs.appendFileSync('logs.txt', logInteraction);

        const responseEmbed = new EmbedBuilder()
          .setDescription('No chat history found. You can start a new conversation with me. Just `/chat`!')
          .setTimestamp();

        await interaction.followUp({
          embeds: [responseEmbed]
        });
      }
    } catch (error) {
      console.error('An error occurred during the clear command:', error);

      const responseEmbed = new EmbedBuilder()
        .setDescription('An error occurred while trying to clear the chat history.')
        .setTimestamp();

      await interaction.followUp({
        embeds: [responseEmbed]
      });
    } finally {
      await mongoClient.close();
    }
  },
};