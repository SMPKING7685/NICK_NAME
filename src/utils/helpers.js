const logger = require('./logger');

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function sanitizeNickname(input) {
  return input
    .replace(/<a?:\w+:\d+>/g, '')
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/[`@#]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 32);
}

function createPaginatedEmbed(title, lines, color = 0x5865f2, pageSize = 15) {
  const chunks = chunkArray(lines, pageSize);
  const pages = chunks.map((chunk, i) => ({
    color,
    title,
    description: chunk.join('\n'),
    footer: { text: `Page ${i + 1} of ${chunks.length}` },
  }));
  return pages;
}

async function handleReactionPagination(reply, pages, client) {
  if (pages.length <= 1) return;

  let currentPage = 0;

  await reply.react('⬅️');
  await reply.react('➡️');

  const filter = (reaction, user) =>
    ['⬅️', '➡️'].includes(reaction.emoji.name) && !user.bot;

  const collector = reply.createReactionCollector({ filter, time: 60000 });

  collector.on('collect', async (reaction, user) => {
    await reaction.users.remove(user.id).catch(() => {});

    if (reaction.emoji.name === '➡️' && currentPage < pages.length - 1) {
      currentPage++;
    } else if (reaction.emoji.name === '⬅️' && currentPage > 0) {
      currentPage--;
    } else {
      return;
    }

    await reply.edit({ embeds: [pages[currentPage]] });
  });

  collector.on('end', () => {
    reply.reactions.removeAll().catch(() => {});
  });
}

module.exports = { chunkArray, sanitizeNickname, createPaginatedEmbed, handleReactionPagination };
