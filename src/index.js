const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const guildConfig = require('./utils/guildConfig');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.config = config;
client.logger = logger;
client.guildConfig = guildConfig;

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    logger.info(`Loaded command: /${command.data.name}`);
  } else {
    logger.warn(`Command ${file} is missing "data" or "execute" property.`);
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  const handler = (...args) => event.execute(...args, client);
  if (event.once) {
    client.once(event.name, handler);
  } else {
    client.on(event.name, handler);
  }
  logger.info(`Loaded event: ${event.name}`);
}

async function deployCommands() {
  try {
    const commands = [];
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if ('data' in command) {
        commands.push(command.data.toJSON());
      }
    }
    if (commands.length === 0) return;

    const rest = new REST({ version: '10' }).setToken(config.token);
    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    await rest.put(route, { body: commands });
    logger.info(`Deployed ${commands.length} slash command(s)`);
  } catch (err) {
    logger.error('Failed to deploy commands:', err.message);
  }
}

function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  client.destroy();
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

(async () => {
  await deployCommands();
  logger.info(`Prefix commands enabled: "${config.prefix}"`);
  client.login(config.token).catch(err => {
    logger.error('Failed to login:', err.message);
    process.exit(1);
  });
})();
