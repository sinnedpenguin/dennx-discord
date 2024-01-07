const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const { genAI, generationConfig, safetySettings, MODEL_NAME } = require('../../lib/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask me anything!')
    .addStringOption(option => option.setName('question').setDescription('Send a question.').setRequired(true)),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      const logInteraction = `${new Date().toLocaleString()}. ${guildId}/${userId}. /${interaction.commandName}: ${interaction.options.getString('question')}.\n`;
      fs.appendFileSync('logs.txt', logInteraction);

      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const question = interaction.options.getString('question');
      const truncatedQuestion = question.substring(0, 256);

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
