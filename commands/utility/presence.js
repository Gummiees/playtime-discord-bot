const { SlashCommandBuilder} = require('discord.js');

// https://discord.js.org/docs/packages/discord.js/14.15.3/BaseInteraction:Class#member
module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('presence')
		.setDescription(`Returns the user's presence if any`),
		async execute(interaction) {
		// https://discord.js.org/docs/packages/discord.js/14.15.3/Activity:Class
		const userActivities = interaction.member.presence?.activities;
		const userPlaying = userActivities?.filter((act) => act.type == 0);
		console.log(`applicationId: ${userPlaying?.map((act) => act.applicationId).join(',')}`)
		console.log(`createdAt: ${userPlaying?.map((act) => act.createdAt).join(',')}`)
		console.log(`createdTimestamp: ${userPlaying?.map((act) => act.createdTimestamp).join(',')}`)
		// act.timestamps.end is always null here
		console.log(`Timestamps: ${userPlaying?.map((act) => `${act.timestamps.start} - ${act.timestamps.end}`).join(',')}`)
		const activities = userPlaying?.join(',') ?? 'none';
		await interaction.reply(`Activities found: ${activities}`);
	},
};