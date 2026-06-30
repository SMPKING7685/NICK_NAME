const { ActivityType } = require('discord.js');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    client.logger.info(`Logged in as ${client.user.tag}`);
    client.logger.info(`Serving ${client.guilds.cache.size} guild(s)`);
    client.logger.info(`Prefix: "${client.config.prefix}" — e.g. "${client.config.prefix} set @user <name>"`);

    client.user.setActivity('/nickname set', { type: ActivityType.Listening });
  },
};
