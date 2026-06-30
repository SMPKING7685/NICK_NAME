const { PermissionFlagsBits } = require('discord.js');
const nicknameStore = require('../utils/nicknameStore');
const guildConfig = require('../utils/guildConfig');
const { checkPermissions, handleSet, handleReset, handleList, handleClear } = require('../utils/nicknameCommands');
const { sanitizeNickname } = require('../utils/helpers');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const channelId = client.config.nicknameChannelId || guildConfig.get(message.guildId, 'nicknameChannelId');
    if (channelId && message.channel.id === channelId) {
      return handleAutoNickname(message, client);
    }

    const prefix = client.config.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const subcommand = args.shift()?.toLowerCase();
    if (!subcommand) return;

    const permission = await checkPermissions(message.member, message.guild, client);
    if (!permission.allowed) {
      return message.reply(permission.message);
    }

    const handlers = {
      set: handleSetPrefix,
      reset: handleResetPrefix,
      list: handleListPrefix,
      clear: handleClearPrefix,
    };

    const handler = handlers[subcommand];
    if (!handler) return;

    await handler(message, client, args);
  },
};

async function handleSetPrefix(message, client, args) {
  const targetUser = message.mentions.users.first();
  if (!targetUser) {
    return message.reply('Please mention a user. Usage: `nick set @user <nickname>`');
  }

  const nickname = args.slice(1).join(' ');
  if (!nickname || nickname.length < 1 || nickname.length > 32) {
    return message.reply(client.config.messages.nicknameTooLong);
  }

  return handleSet({
    guild: message.guild,
    targetUser,
    nickname,
    author: message.author,
    client,
    reply: (content) => message.reply(content),
  });
}

async function handleResetPrefix(message, client, args) {
  const targetUser = message.mentions.users.first();
  if (!targetUser) {
    return message.reply('Please mention a user. Usage: `nick reset @user`');
  }

  return handleReset({
    guild: message.guild,
    targetUser,
    author: message.author,
    client,
    reply: (content) => message.reply(content),
  });
}

async function handleListPrefix(message, client) {
  return handleList({
    guild: message.guild,
    client,
    reply: (opts) => {
      if (typeof opts === 'string') return message.reply(opts);
      const { content, embeds } = opts;
      if (embeds) return message.reply({ embeds });
      return message.reply(content);
    },
  });
}

async function handleClearPrefix(message, client, args) {
  const targetUser = message.mentions.users.first();
  if (!targetUser) {
    return message.reply('Please mention a user. Usage: `nick clear @user`');
  }

  return handleClear({
    guild: message.guild,
    targetUser,
    author: message.author,
    client,
    reply: (content) => message.reply(content),
  });
}

async function handleAutoNickname(message, client) {
  const nickname = sanitizeNickname(message.content);

  if (!nickname || nickname.length > 32) return;

  if (
    !message.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames) ||
    !message.member.moderatable
  ) return;

  try {
    await message.member.setNickname(nickname, `Auto-nickname in #${message.channel.name}`);
    nicknameStore.set(message.guildId, message.author.id, nickname);
    client.logger.info(`Auto-nickname: ${message.author.tag} → "${nickname}"`);

    await message.react('✅').catch(() => {});
  } catch (err) {
    client.logger.error(`Auto-nickname failed for ${message.author.tag}:`, err.message);
  }
}
