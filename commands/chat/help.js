const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const package = require('../../package.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display available commands and bot info.'),

  execute(interaction) {
    const commands = interaction.client.commands.map(command => `\`${command.data.name}\``).join(', ');

    const helpEmbed = new EmbedBuilder()
      .setTitle('Commands')
      .setDescription(`${commands}`)
      .addFields(
        { name: ' ', value: ' ' },
        { 
          name: 'Note:', 
          value: 'Please be aware that both `/chat` and `/c` commands store your chat history in a database to maintain a conversational context during your interactions with DennX. You can delete your chat history by using `/clear`. For one-time questions without storage, use `/ask`.'
        },
        { name: ' ', value: ' ' },
        { name: `DennX v${package.version}`, value: `:copyright: [sinnedpenguin](${config.developer})` },
        { name: ' ', value: `✨[Website](${config.website}) | [Support Server](${config.supportServer}) | [Vote](${config.vote}) | [Donate](${config.donate})` }
      );

    interaction.reply({ embeds: [helpEmbed] });
  }
};