const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const moment = require('moment');
require('moment-precise-range-plugin');
const { getActivities } = require('../../database/getActivities');
const { NoUserError } = require('../../database/exceptions/noUserError');
const { findTimer } = require('../../timers');
const { getRange, calculateTime } = require('../../utils');
const { logError } = require('../../logger');

const GAMES_PER_PAGE = 10;

// https://discord.js.org/docs/packages/discord.js/14.15.3/BaseInteraction:Class
module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('timers')
		.setDescription(`Returns all the games you got registered and the total amount of time spent on each`),
	async execute(interaction) {
		const userId = interaction.user.id;
		await interaction.deferReply();
		try {
			const games = await getActivities(userId);
			if(games.length === 0) {
				await interaction.editReply(`You have no games registered.`);
				return;
			}

			const gamesWithTime = games.map(game => {
				const timer = findTimer(userId, game.id);
				let totalTime = game.time;
				if(timer) {
					totalTime += calculateTime(timer);
				}
				return {
					name: game.name,
					time: totalTime
				};
			});

			// Sort games by playtime (most played first)
			gamesWithTime.sort((a, b) => b.time - a.time);

			const totalPages = Math.ceil(gamesWithTime.length / GAMES_PER_PAGE);
			const currentPage = 0;

			const content = this.getPageContent(gamesWithTime, currentPage, interaction.user.username);
			const components = this.getPageComponents(currentPage, totalPages);

			const reply = await interaction.editReply({
				content,
				components: components ? [components] : []
			});

			if (components) {
				const collector = reply.createMessageComponentCollector({ time: 60000 });

				collector.on('collect', async i => {
					if (i.user.id !== interaction.user.id) {
						await i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
						return;
					}

					const newPage = i.customId === 'next' ? currentPage + 1 : currentPage - 1;
					await i.update({
						content: this.getPageContent(gamesWithTime, newPage, interaction.user.username),
						components: [this.getPageComponents(newPage, totalPages)]
					});
				});

				collector.on('end', () => {
					interaction.editReply({ components: [] });
				});
			}
		} catch (e) {
			logError(`Error in timers command for user ${userId}: ${e.message}`);
			if (e instanceof NoUserError) {
				await interaction.editReply(`You have no games registered.`);
			} else {
				await interaction.editReply('There was an error while fetching your games.');
			}
		}
	},

	getPageContent(games, page, username) {
		const start = page * GAMES_PER_PAGE;
		const end = start + GAMES_PER_PAGE;
		const pageGames = games.slice(start, end);
		
		const totalPlaytime = games.reduce((total, game) => total + game.time, 0);
		const totalGames = games.length;
		
		let content = `🎮 **${username}'s Gaming Stats**\n`;
		content += `📊 Total Games: **${totalGames}** | Total Playtime: **${getRange(totalPlaytime)}**\n\n`;
		
		if (totalGames > GAMES_PER_PAGE) {
			content += `Showing games ${start + 1}-${Math.min(end, games.length)} of ${games.length}\n\n`;
		}

		const gamesString = pageGames.map((game, index) => {
			const position = start + index + 1;
			const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '▫️';
			return `${medal} **${game.name}**\n   ⏰ ${getRange(game.time)}`;
		});
		
		return content + gamesString.join('\n');
	},

	getPageComponents(currentPage, totalPages) {
		if (totalPages <= 1) return null;

		const row = new ActionRowBuilder();

		if (currentPage > 0) {
			row.addComponents(
				new ButtonBuilder()
					.setCustomId('prev')
					.setLabel('◀️ Previous')
					.setStyle(ButtonStyle.Primary)
			);
		}

		if (currentPage < totalPages - 1) {
			row.addComponents(
				new ButtonBuilder()
					.setCustomId('next')
					.setLabel('Next ▶️')
					.setStyle(ButtonStyle.Primary)
			);
		}

		return row;
	}
};