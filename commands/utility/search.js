const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getActivities } = require('../../database/getActivities');
const { NoUserError } = require('../../database/exceptions/noUserError');
const { findTimer } = require('../../timers');
const { getRange, calculateTime } = require('../../utils');

const GAMES_PER_PAGE = 10;

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

            const totalPages = Math.ceil(matchingGames.length / GAMES_PER_PAGE);
            let currentPage = 0;

            const embed = this.getPageEmbed(matchingGames, currentPage, searchQuery, interaction.user);
            const components = this.getPageComponents(currentPage, totalPages);

            const reply = await interaction.editReply({
                embeds: [embed],
                components: components ? [components] : []
            });

            if (components) {
                const collector = reply.createMessageComponentCollector({ time: 60000 });

                collector.on('collect', async i => {
                    if (i.user.id !== interaction.user.id) {
                        await i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
                        return;
                    }

                    // Update the current page based on which button was clicked
                    switch (i.customId) {
                        case 'first':
                            currentPage = 0;
                            break;
                        case 'last':
                            currentPage = totalPages - 1;
                            break;
                        case 'next':
                            currentPage++;
                            break;
                        case 'prev':
                            currentPage--;
                            break;
                    }
                    
                    // Ensure currentPage stays within bounds
                    currentPage = Math.max(0, Math.min(currentPage, totalPages - 1));

                    await i.update({
                        embeds: [this.getPageEmbed(matchingGames, currentPage, searchQuery, interaction.user)],
                        components: [this.getPageComponents(currentPage, totalPages)]
                    });
                });

                collector.on('end', async () => {
                    // Only try to remove components if the message still exists and is editable
                    try {
                        await interaction.editReply({ 
                            embeds: [this.getPageEmbed(matchingGames, currentPage, searchQuery, interaction.user)],
                            components: [] 
                        });
                    } catch (error) {
                        // Ignore any errors that might occur if the message was deleted
                    }
                });
            }
        } catch (e) {
            if (e instanceof NoUserError) {
                await interaction.editReply(`You have no games registered.`);
            } else {
                await interaction.editReply('There was an error while searching for games.');
            }
        }
    },

    getPageEmbed(games, page, searchQuery, user) {
        const start = page * GAMES_PER_PAGE;
        const end = start + GAMES_PER_PAGE;
        const pageGames = games.slice(start, end);
        
        const totalPlaytime = games.reduce((total, game) => total + game.time, 0);
        const totalGames = games.length;

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setAuthor({
                name: `${user.username}'s Search Results`,
                iconURL: user.displayAvatarURL()
            })
            .setTitle(`🔍 Search Results for "${searchQuery}"`)
            .setDescription(`Found **${totalGames}** games with total playtime: **${getRange(totalPlaytime)}**`)
            .setTimestamp();

        if (totalGames > GAMES_PER_PAGE) {
            embed.setFooter({
                text: `Page ${page + 1}/${Math.ceil(totalGames / GAMES_PER_PAGE)} • Showing games ${start + 1}-${Math.min(end, games.length)} of ${games.length}`
            });
        }

        // Add games as fields
        pageGames.forEach((game, index) => {
            const position = start + index + 1;
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '▫️';
            embed.addFields({
                name: `${medal} ${game.name}`,
                value: `⏰ ${getRange(game.time)}`,
                inline: false
            });
        });

        return embed;
    },

    getPageComponents(currentPage, totalPages) {
        if (totalPages <= 1) return null;

        const row = new ActionRowBuilder();

        // Add "First" button if not on first page
        if (currentPage > 0) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('first')
                    .setLabel('⏮️ First')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        // Add "Previous" button if not on first page
        if (currentPage > 0) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️ Previous')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        // Add "Next" button if not on last page
        if (currentPage < totalPages - 1) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next ▶️')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        // Add "Last" button if not on last page
        if (currentPage < totalPages - 1) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('last')
                    .setLabel('Last ⏭️')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        return row;
    }
}; 