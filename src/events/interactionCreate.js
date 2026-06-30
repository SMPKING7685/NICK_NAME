const { MessageFlags } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      client.logger.error(`Error executing /${interaction.commandName}:`, err.message);

      const reply = {
        content: 'An unexpected error occurred while executing this command.',
        flags: MessageFlags.Ephemeral,
      };

      try {
        if (interaction.deferred) {
          await interaction.editReply(reply);
        } else if (interaction.replied) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      } catch (followErr) {
        client.logger.error(`Failed to send error response for /${interaction.commandName}:`, followErr.message);
      }
    }
  },
};
