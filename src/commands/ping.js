const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Check the bot's latency"),

  async execute(interaction, client) {
    const sent = await interaction.reply({
      content: 'Pinging...',
      fetchReply: true,
      flags: MessageFlags.Ephemeral,
    });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(roundtrip < 200 ? 0x57f287 : roundtrip < 500 ? 0xfee75c : 0xed4245)
      .setTitle('Pong!')
      .addFields(
        { name: 'Roundtrip Latency', value: `\`${roundtrip}ms\``, inline: true },
        { name: 'WebSocket Heartbeat', value: `\`${ws}ms\``, inline: true },
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
