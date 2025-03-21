const { SlashCommandBuilder } = require('discord.js');
const { getActivities } = require('../../database/getActivities');
const { NoUserError } = require('../../database/exceptions/noUserError');
const { findTimer } = require('../../timers');
const { getRange, calculateTime } = require('../../utils');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for games by name and show their playtime')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The game name to search for')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const searchQuery = interaction.options.getString('query').toLowerCase();

        await interaction.deferReply();
        try {
            const games = await getActivities(userId);
            if (games.length === 0) {
                await interaction.editReply(`You have no games registered.`);
                return;
            }

            const matchingGames = games.filter(game => 
                game.name.toLowerCase().includes(searchQuery)
            ).map(game => {
                const timer = findTimer(userId, game.id);
                let totalTime = game.time;
                if (timer) {
                    totalTime += calculateTime(timer);
                }
                return {
                    name: game.name,
                    time: totalTime
                };
            });

            if (matchingGames.length === 0) {
                await interaction.editReply(`🔍 No games found matching "**${searchQuery}**".`);
                return;
            }

            // Sort games by playtime (most played first)
            matchingGames.sort((a, b) => b.time - a.time);

            const totalPlaytime = matchingGames.reduce((total, game) => total + game.time, 0);
            
            let content = `🔍 **Search Results for "${searchQuery}"**\n`;
            content += `📊 Found **${matchingGames.length}** games | Total Playtime: **${getRange(totalPlaytime)}**\n\n`;

            const gamesString = matchingGames.map((game, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▫️';
                return `${medal} **${game.name}**\n   ⏰ ${getRange(game.time)}`;
            });

            await interaction.editReply(content + gamesString.join('\n'));
        } catch (e) {
            if (e instanceof NoUserError) {
                await interaction.editReply(`You have no games registered.`);
            } else {
                await interaction.editReply('There was an error while searching for games.');
            }
        }
    },
}; 