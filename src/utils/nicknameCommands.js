const { PermissionFlagsBits } = require('discord.js');
const nicknameStore = require('./nicknameStore');
const { sanitizeNickname, createPaginatedEmbed, handleReactionPagination } = require('./helpers');

async function checkPermissions(member, guild, client) {
  if (!member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
    return { allowed: false, message: client.config.messages.noPermission };
  }

  if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
    return { allowed: false, message: client.config.messages.botNoPermission };
  }

  return { allowed: true };
}

async function getTargetMember(guild, userId) {
  return guild.members.fetch(userId).catch(() => null);
}

async function handleSet({ guild, targetUser, nickname, author, client, reply }) {
  const targetMember = await getTargetMember(guild, targetUser.id);

  if (!targetMember) {
    return reply(client.config.messages.userNotFound);
  }

  if (!targetMember.moderatable) {
    return reply(client.config.messages.cannotModify);
  }

  const sanitized = sanitizeNickname(nickname);
  if (!sanitized || sanitized.length > 32) {
    return reply('Nickname must be between 1 and 32 characters after filtering.');
  }

  try {
    const oldNickname = targetMember.nickname || targetMember.user.username;
    await targetMember.setNickname(sanitized, `Set by ${author.tag}`);
    nicknameStore.set(guild.id, targetUser.id, sanitized);

    client.logger.info(
      `${author.tag} changed ${targetUser.tag}'s nickname from "${oldNickname}" to "${sanitized}"`,
    );

    return reply(client.config.messages.nicknameSet(targetUser.toString(), sanitized));
  } catch (err) {
    client.logger.error(`Failed to set nickname for ${targetUser.tag}:`, err.message);
    return reply(`Failed to set nickname: ${err.message}`);
  }
}

async function handleReset({ guild, targetUser, author, client, reply }) {
  const targetMember = await getTargetMember(guild, targetUser.id);

  if (!targetMember) {
    return reply(client.config.messages.userNotFound);
  }

  if (!targetMember.moderatable) {
    return reply(client.config.messages.cannotModify);
  }

  try {
    await targetMember.setNickname(null, `Reset by ${author.tag}`);
    nicknameStore.delete(guild.id, targetUser.id);

    client.logger.info(`${author.tag} reset ${targetUser.tag}'s nickname`);

    return reply(client.config.messages.nicknameReset(targetUser.toString()));
  } catch (err) {
    client.logger.error(`Failed to reset nickname for ${targetUser.tag}:`, err.message);
    return reply(`Failed to reset nickname: ${err.message}`);
  }
}

async function handleList({ guild, client, reply }) {
  const entries = nicknameStore.getAll(guild.id);

  if (entries.length === 0) {
    return reply({ content: 'No custom nicknames have been set by this bot.', ephemeral: true });
  }

  const lines = await Promise.all(
    entries.map(async ([userId, nickname]) => {
      const member = await getTargetMember(guild, userId);
      const tag = member ? member.user.username : `Unknown (${userId})`;
      return `• **${tag}** → ${nickname}`;
    }),
  );

  const pages = createPaginatedEmbed('Custom Nicknames', lines);
  const msg = await reply({ embeds: [pages[0]], fetchReply: true });
  if (pages.length > 1) {
    await handleReactionPagination(msg, pages, client);
  }
}

async function handleClear({ targetUser, guild, author, client, reply }) {
  const deleted = nicknameStore.delete(guild.id, targetUser.id);

  if (!deleted) {
    return reply(`No nickname log entry found for ${targetUser.toString()}.`);
  }

  client.logger.info(`${author.tag} cleared ${targetUser.tag} from the nickname log`);
  return reply(client.config.messages.nicknameCleared(targetUser.toString()));
}

module.exports = { checkPermissions, handleSet, handleReset, handleList, handleClear };
