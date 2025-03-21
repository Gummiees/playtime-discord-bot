const { SlashCommandBuilder } = require('discord.js');
const moment = require('moment');
require('moment-precise-range-plugin');
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
            );

            if (matchingGames.length === 0) {
                await interaction.editReply(`No games found matching "${searchQuery}".`);
                return;
            }

            const gamesString = matchingGames.map(game => {
                const timer = findTimer(userId, game.id);
                let totalTime = game.time;
                if (timer) {
                    totalTime += calculateTime(timer);
                }

                return `${game.name} - ${getRange(totalTime)}`;
            });

            await interaction.editReply(`Games matching "${searchQuery}":\n${gamesString.join('\n')}`);
        } catch (e) {
            if (e instanceof NoUserError) {
                await interaction.editReply(`You have no games registered.`);
            }
            throw e;
        }
    },
}; 