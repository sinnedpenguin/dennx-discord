const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');

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
    .setName('a')
    .setDescription('Ask me anything! In private!')
    .addStringOption(option => option.setName('question').setDescription('Send a private question.').setRequired(true)),
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
        .setDescription(`🔓 Unlock the \`private ask\` feature by casting your vote on \`Top.gg\`! Your vote unlocks access for \`12 hours\`. ⭐`);

      await interaction.reply({
        embeds: [responseEmbed],
        components: [row],
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      const logInteraction = `${new Date().toLocaleString()}. ${guildId}/${userId}. /${interaction.commandName}: ${interaction.options.getString('question')}.\n`;
      fs.appendFileSync('logs.txt', logInteraction);

      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const question = interaction.options.getString('question');
      const truncatedQuestion = question.substring(0, 256); // Limit to 256 characters

      const prompt = `You are DennX. Your name is DennX. You're an AI chatbot powered by Google's Gemini Pro. ${truncatedQuestion}`

      const result = await model.generateContent(
        prompt,
        generationConfig,
        safetySettings,
      );
      const responseMessage = result.response.text();
      
      if (responseMessage.length > 2000) {
        const chunks = responseMessage.match(/[\s\S]{1,2000}/g) || [];
        const totalChunks = chunks.length;

        for (let i = 0; i < totalChunks; i++) {
          const responseEmbed = new EmbedBuilder()
            .setTitle(`${truncatedQuestion}`)
            .setDescription(`${chunks[i]}`)
            .setFooter({ text: `${i + 1}/${totalChunks}` })

          await interaction.followUp({
            embeds: [responseEmbed]
          });
        }
      } else {
        const responseEmbed = new EmbedBuilder()
          .setTitle(`${truncatedQuestion}`)
          .setDescription(`${responseMessage}`);

        await interaction.followUp({
          embeds: [responseEmbed]
        });
      }
    } catch (error) {
      console.error(error);

      const responseEmbed = new EmbedBuilder()
        .setTitle(`Error`)
        .setDescription(`I'm sorry, but there was an error processing your request.`)

      await interaction.followUp({ 
        embeds: [responseEmbed]
      });
    }
  },
};
