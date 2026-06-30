const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction, client) {
    const prefix = client.config.prefix;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Nickname Bot — Commands')
      .setDescription('Manage server nicknames with slash commands or text commands.')
      .addFields(
        {
          name: 'Slash Commands',
          value:
            '`/nickname set <user> <name>` — Set a user\'s nickname\n' +
            '`/nickname reset <user>` — Reset a user\'s nickname\n' +
            '`/nickname list` — List all custom nicknames\n' +
            '`/nickname clear <user>` — Clear a user from the log\n' +
            '`/setup create` — Create the auto-nickname channel\n' +
            '`/setup reset` — Recreate the auto-nickname channel\n' +
            '`/setup disable` — Disable auto-nickname\n' +
            '`/ping` — Check bot latency\n' +
            '`/help` — Show this message',
        },
        {
          name: `Prefix Commands (${prefix})`,
          value:
            `\`${prefix} set @user <name>\` — Set a user's nickname\n` +
            `\`${prefix} reset @user\` — Reset a user's nickname\n` +
            `\`${prefix} list\` — List all custom nicknames\n` +
            `\`${prefix} clear @user\` — Clear a user from the log`,
        },
        {
          name: 'Auto-Nickname',
          value:
            'Set up a dedicated channel with `/setup create`. Anyone who types in that channel gets their nickname updated automatically.',
        },
      )
      .setFooter({ text: 'Requires Manage Nicknames permission to modify nicknames' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
