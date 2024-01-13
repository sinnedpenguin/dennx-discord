const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const config = require('../../config.json');
const fs = require('fs');

const mongoURI = process.env.MONGODB_URI;
const mongoClient = new MongoClient(mongoURI);

const { genAI, generationConfig, safetySettings, MODEL_NAME } = require('../../lib/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat with me!')
    .addStringOption(option => option.setName('message').setDescription('Send a message.').setRequired(true)),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      const logInteraction = `${new Date().toLocaleString()}. ${guildId}/${userId}. /${interaction.commandName}: ${interaction.options.getString('message')}.\n`;
      fs.appendFileSync('logs.txt', logInteraction);

      await mongoClient.connect();
      const chatCollection = mongoClient.db().collection('chatHistory');

      if (!chatCollection) {
        await interaction.followUp('Error connecting to MongoDB.');
        return;
      }

      const userChatHistory = (await chatCollection.findOne({ guildId, userId })) || { history: [] };

      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const chat = model.startChat({
        history: userChatHistory.history.map(entry => [
          { role: "user", parts: `You are ${config.name}. Your name is ${config.name}. You're an AI chatbot powered by Google's Gemini Pro. ${entry.parts}` },
          { role: "model", parts: `Understood. I am ${config.name}. My name is ${config.name}. I'm an AI chatbot powered by Google's Gemini Pro. ${entry.responseMessage}` },
        ]).flat(),
        generationConfig,
        safetySettings,
      });

      const result = await chat.sendMessage(interaction.options.getString('message'));
      const responseMessage = result.response.text();

      userChatHistory.history.push({
        role: "user",
        parts: interaction.options.getString('message'),
        responseMessage: responseMessage,
        command: interaction.commandName,
      });

      await chatCollection.updateOne(
        { guildId, userId },
        { $set: { history: userChatHistory.history } },
        { upsert: true }
      );
      
      const truncatedMessage = interaction.options.getString('message').substring(0, 256);

      if (responseMessage.length > 2000) {
        const chunks = responseMessage.match(/[\s\S]{1,2000}/g) || [];
        const totalChunks = chunks.length;

        for (let i = 0; i < totalChunks; i++) {
          const responseEmbed = new EmbedBuilder()
            .setTitle(`${truncatedMessage}`)
            .setDescription(`${chunks[i]}`)
            .setFooter({ text: `${i + 1}/${totalChunks}` })

          await interaction.followUp({
            embeds: [responseEmbed]
          });
        }
      } else {
        const responseEmbed = new EmbedBuilder()
          .setTitle(`${truncatedMessage}`)
          .setDescription(`${responseMessage}`);

        await interaction.followUp({
          embeds: [responseEmbed]
        });
      }
    } catch (error) {
      console.error(error);

      const responseEmbed = new EmbedBuilder()
        .setDescription(`I'm sorry, but I cannot answer that.`);

      await interaction.followUp({ 
        embeds: [responseEmbed]
      });
    } finally {
      await mongoClient.close();
    }
  },
};
