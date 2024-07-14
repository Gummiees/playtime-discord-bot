const { SlashCommandBuilder} = require('discord.js');
const moment = require('moment');
require('moment-precise-range-plugin');
const { getActivities } = require('../../database/getActivities');
const { NoUserError } = require('../../database/exceptions/noUserError');

function getRange(timeInSeconds) {
	return moment.preciseDiff(moment(), moment().add(timeInSeconds, 's'));
}

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
				// FIXME: it could be that the user is currently playing a game while executing the command.
				// we should check if they are in a game, and if so then search for the timer on the timers array from index.js.
				// Then, we should add the time from this timer to the one found on the database if any.
				// FIXME: print properly
				const gamesString = games.map(game => `${game.name} - ${getRange(game.time)}`);
				await interaction.editReply(`Games found:\n${gamesString.join('\n')}`);
			} catch (e) {
				if (e instanceof NoUserError) {
					await interaction.editReply(`You have no games registered.`);
				}
				throw e;
			}
	},
};