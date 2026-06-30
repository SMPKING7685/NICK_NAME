const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require('discord.js');
const guildConfig = require('../utils/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Manage the auto-nickname channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create the auto-nickname channel')
        .addStringOption(opt =>
          opt
            .setName('channel_name')
            .setDescription('Name for the channel (default: "nickname-change")')
            .setRequired(false),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription('Delete the current channel and create a new one'),
    )
    .addSubcommand(sub =>
      sub
        .setName('disable')
        .setDescription('Disable the auto-nickname feature'),
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') return handleCreate(interaction, client);
    if (sub === 'reset') return handleReset(interaction, client);
    if (sub === 'disable') return handleDisable(interaction, client);
  },
};

function buildChannelOptions(guild, name) {
  return {
    name,
    type: ChannelType.GuildText,
    topic: 'Type your desired nickname here to change your server nickname automatically.',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        deny: [
          PermissionFlagsBits.CreatePublicThreads,
          PermissionFlagsBits.CreatePrivateThreads,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      {
        id: guild.members.me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.AddReactions,
        ],
      },
    ],
  };
}

async function sendWelcomeMessage(channel, guild) {
  const welcome = new EmbedBuilder()
    .setColor(0x57f287)
    .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
    .setTitle('__Nickname Change Channel__')
    .setDescription('Type any message in this channel to instantly update your server nickname.')
    .addFields(
      {
        name: ':arrow_forward: __How to Use__',
        value:
          ':one: Type your **desired nickname** and send the message\n' +
          ':two: The **bot** will update your nickname instantly\n' +
          ':three: You\'ll see a :white_check_mark: reaction confirming the change',
        inline: false,
      },
      {
        name: ':clipboard: __Rules__',
        value:
          ':small_blue_diamond: **1–32 characters** in length\n' +
          ':small_blue_diamond: Must be **appropriate** for the server\n' +
          ':small_blue_diamond: **No** emoji-only or spam-like names\n' +
          ':small_blue_diamond: Server rules **apply** at all times',
        inline: true,
      },
    )
    .setFooter({ text: 'Nickname Bot', iconURL: guild.members.me?.displayAvatarURL() })
    .setTimestamp();

  await channel.send({ embeds: [welcome] });
}

async function ensureManageChannels(interaction) {
  if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await interaction.editReply('I need the **Manage Channels** permission to manage the channel.');
    return false;
  }
  return true;
}

async function handleCreate(interaction, client) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!await ensureManageChannels(interaction)) return;

  const existingId = guildConfig.get(interaction.guildId, 'nicknameChannelId');
  if (existingId) {
    const existing = await interaction.guild.channels.fetch(existingId).catch(() => null);
    if (existing) {
      return interaction.editReply(
        `A nickname channel already exists: ${existing}. Use \`/setup reset\` to replace it.`,
      );
    }
  }

  const channelName = interaction.options.getString('channel_name') || 'nickname-change';
  const channel = await interaction.guild.channels.create(buildChannelOptions(interaction.guild, channelName));

  guildConfig.set(interaction.guildId, 'nicknameChannelId', channel.id);

  client.logger.info(
    `${interaction.user.tag} created auto-nickname channel #${channel.name} (${channel.id}) in ${interaction.guild.name}`,
  );

  await sendWelcomeMessage(channel, interaction.guild);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Setup Complete')
    .setDescription(`Auto-nickname channel created: ${channel}`)
    .addFields(
      { name: 'Channel', value: `${channel}`, inline: true },
      { name: 'How it works', value: 'Users type in that channel → bot updates their nickname instantly.' },
    )
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

async function handleReset(interaction, client) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!await ensureManageChannels(interaction)) return;

  const existingId = guildConfig.get(interaction.guildId, 'nicknameChannelId');
  if (existingId) {
    const existing = await interaction.guild.channels.fetch(existingId).catch(() => null);
    if (existing) {
      await existing.delete('Channel reset via /setup reset');
    }
  }

  guildConfig.delete(interaction.guildId, 'nicknameChannelId');

  const channelName = interaction.options.getString('channel_name') || 'nickname-change';
  const channel = await interaction.guild.channels.create(buildChannelOptions(interaction.guild, channelName));

  guildConfig.set(interaction.guildId, 'nicknameChannelId', channel.id);

  await sendWelcomeMessage(channel, interaction.guild);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Channel Reset')
    .setDescription(`Auto-nickname channel has been recreated: ${channel}`)
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

async function handleDisable(interaction, client) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const existingId = guildConfig.get(interaction.guildId, 'nicknameChannelId');
  if (existingId) {
    if (interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      const existing = await interaction.guild.channels.fetch(existingId).catch(() => null);
      if (existing) {
        await existing.delete('Channel disabled via /setup disable');
      }
    }
    guildConfig.delete(interaction.guildId, 'nicknameChannelId');
  }

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('Feature Disabled')
    .setDescription('The auto-nickname feature has been disabled and the channel has been removed.')
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}
