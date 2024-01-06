const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const fs = require('fs');

const mongoURI = process.env.MONGODB_URI;
const mongoClient = new MongoClient(mongoURI);

const { genAI, generationConfig, safetySettings, MODEL_NAME } = require('../../lib/config');

const TOPGG_TOKEN = process.env.TOPGG_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

async function checkTopGGVote(userId) {
  const response = await fetch(
    `https://top.gg/api/bots/${CLIENT_ID}/check?userId=${userId}`,
    {
      method: "GET",
      headers: {
        Authorization: TOPGG_TOKEN,
      },
    },
  );

  const data = await response.json();
  console.log("Top.gg API Response:", data);

  return data.voted === 1;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('c')
    .setDescription('Chat with me! In private!')
    .addStringOption(option => option.setName('message').setDescription('Send a private message.').setRequired(true)),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    if (!userId) {
      const responseEmbed = new EmbedBuilder()
        .setDescription(`❌ Unable to identify user.`);

      console.error("User ID is undefined");
      await interaction.reply({
        embeds: [responseEmbed],
        ephemeral: true,
      });
      return;
    }

    const hasVoted = await checkTopGGVote(userId);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Vote")
        .setURL("https://top.gg/bot/1175486521659363328/vote")
        .setStyle(ButtonStyle.Link)
        .setEmoji(`⬆️`),
    );

    if (!hasVoted) {
      const responseEmbed = new EmbedBuilder()
        .setDescription(`🔓 Unlock the \`private chat\` feature by casting your vote on \`Top.gg\`! Your vote unlocks access for \`12 hours\`. ⭐`);

      await interaction.reply({
        embeds: [responseEmbed],
        components: [row],
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });

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
          { role: "user", parts: `You are DennX. Your name is DennX. You're an AI chatbot powered by Google's Gemini Pro. ${entry.parts}` },
          { role: "model", parts: `Understood. I am DennX. My name is DennX. I'm an AI chatbot powered by Google's Gemini Pro. ${entry.responseMessage}` },
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

      if (responseMessage.length > 2000) {
        const chunks = responseMessage.match(/[\s\S]{1,2000}/g) || [];
        const totalChunks = chunks.length;

        for (let i = 0; i < totalChunks; i++) {
          const responseEmbed = new EmbedBuilder()
            .setTitle(`${interaction.options.getString('message')}`)
            .setDescription(`${chunks[i]}`)
            .setFooter({ text: `${i + 1}/${totalChunks}` });

          await interaction.followUp({
            embeds: [responseEmbed],
          });
        }
      } else {
        const responseEmbed = new EmbedBuilder()
          .setTitle(`${interaction.options.getString('message')}`)
          .setDescription(`${responseMessage}`);

        await interaction.followUp({
          embeds: [responseEmbed],
        });
      }
    } catch (error) {
      console.error(error);

      const responseEmbed = new EmbedBuilder()
        .setTitle(`${interaction.options.getString('message')}`)
        .setDescription(`I'm sorry, but I cannot answer that.`);

      await interaction.followUp({
        embeds: [responseEmbed],
      });
    } finally {
      await mongoClient.close();
    }
  },
};
