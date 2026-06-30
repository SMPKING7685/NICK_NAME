const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { checkPermissions, handleSet, handleReset, handleList, handleClear } = require('../utils/nicknameCommands');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('Manage server nicknames')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription("Set a user's nickname")
        .addUserOption(opt =>
          opt.setName('user').setDescription('The user to rename').setRequired(true),
        )
        .addStringOption(opt =>
          opt
            .setName('nickname')
            .setDescription('The new nickname (1–32 characters)')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(32),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription("Reset a user's nickname to their username")
        .addUserOption(opt =>
          opt.setName('user').setDescription('The user to reset').setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all custom nicknames set by this bot'),
    )
    .addSubcommand(sub =>
      sub
        .setName('clear')
        .setDescription("Remove a user from the bot's nickname log")
        .addUserOption(opt =>
          opt.setName('user').setDescription('The user to remove from the log').setRequired(true),
        ),
    ),

  async execute(interaction, client) {
    const permission = await checkPermissions(interaction.member, interaction.guild, client);
    if (!permission.allowed) {
      return interaction.reply({ content: permission.message, flags: MessageFlags.Ephemeral });
    }

    const subcommand = interaction.options.getSubcommand();
    const reply = (opts) => interaction.reply({ ...opts, flags: MessageFlags.Ephemeral });

    const handlers = {
      set: () => handleSet({
        guild: interaction.guild,
        targetUser: interaction.options.getUser('user'),
        nickname: interaction.options.getString('nickname'),
        author: interaction.user,
        client,
        reply: (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral }),
      }),
      reset: () => handleReset({
        guild: interaction.guild,
        targetUser: interaction.options.getUser('user'),
        author: interaction.user,
        client,
        reply: (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral }),
      }),
      list: () => handleList({
        guild: interaction.guild,
        client,
        reply: (opts) => interaction.reply({ ...opts, flags: MessageFlags.Ephemeral }),
      }),
      clear: () => handleClear({
        guild: interaction.guild,
        targetUser: interaction.options.getUser('user'),
        author: interaction.user,
        client,
        reply: (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral }),
      }),
    };

    return handlers[subcommand]();
  },
};
