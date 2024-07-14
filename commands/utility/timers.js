const { SlashCommandBuilder} = require('discord.js');
const moment = require('moment');
require('moment-precise-range-plugin');
const { getActivities } = require('../../database/getActivities');
const { NoUserError } = require('../../database/exceptions/noUserError');
const { findTimer } = require('../../timers');
const { getRange, calculateTime } = require('../../utils');

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
			const gamesString = games.map(game => {
				const timer = findTimer(userId, game.id);
				let totalTime = game.time;
				if(timer) {
					totalTime += calculateTime(timer);
				}

				return `${game.name} - ${getRange(totalTime)}`;
			});
			// FIXME: print properly
			await interaction.editReply(`Games found:\n${gamesString.join('\n')}`);
		} catch (e) {
			if (e instanceof NoUserError) {
				await interaction.editReply(`You have no games registered.`);
			}
			throw e;
		}
	},
};