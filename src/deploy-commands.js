const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    logger.info(`Deploying ${commands.length} slash command(s)...`);

    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    const data = await rest.put(route, { body: commands });

    logger.info(`Successfully deployed ${data.length} slash command(s).`);
    process.exit(0);
  } catch (err) {
    logger.error('Failed to deploy commands:', err.message);
    process.exit(1);
  }
})();
