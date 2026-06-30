require('dotenv').config();

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  prefix: process.env.PREFIX || '&',
  nicknameChannelId: process.env.NICKNAME_CHANNEL_ID || null,

  permissions: {
    required: ['ManageNicknames'],
  },

  messages: {
    noPermission: 'You need the **Manage Nicknames** permission to use this command.',
    botNoPermission: 'I need the **Manage Nicknames** permission to perform this action.',
    nicknameSet: (user, nickname) => `Successfully set ${user}'s nickname to **${nickname}**.`,
    nicknameReset: (user) => `Successfully reset ${user}'s nickname.`,
    nicknameCleared: (user) => `Successfully cleared ${user}'s nickname log.`,
    nicknameTooLong: 'Nickname must be between 1 and 32 characters.',
    userNotFound: 'Could not find that user in this server.',
    cannotModify: 'I cannot modify that user — they may have higher permissions than me.',
  },
};

if (!config.token || !config.clientId) {
  console.error('Missing required environment variables. Check your .env file.');
  process.exit(1);
}

module.exports = config;
