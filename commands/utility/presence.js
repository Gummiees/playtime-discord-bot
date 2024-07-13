const { SlashCommandBuilder} = require('discord.js');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');


// https://discord.js.org/docs/packages/discord.js/14.15.3/BaseInteraction:Class
module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('presence')
		.setDescription(`Returns the user's presence if any`),
		async execute(interaction) {
		// https://discord.js.org/docs/packages/discord.js/14.15.3/Activity:Class
		const userActivities = interaction.member.presence?.activities;
		const userPlaying = userActivities?.filter((act) => act.type == 0);
		const activities = userPlaying ?? ['none'];

		await interaction.deferReply();

		if(userPlaying !== null && userPlaying.length > 0) {
			const userId = interaction.user.id;
			const gameActivity = userPlaying[0];
			const gameId = gameActivity.applicationId;

			const db = getFirestore();
			const usersRef = db.collection('users');
			await usersRef.doc(userId).set({ id: userId });
			const gameRef = usersRef.doc(userId).collection('games').doc(gameId);
			const gameDoc = await gameRef.get();
			
			if (gameDoc.exists) {
				const currentTime = gameDoc.data().time;
				console.log(`game found for this user! name: ${gameActivity.name}, time: ${currentTime}`);
			}

			await gameRef.set({ id: gameId, name: gameActivity.name, time: 1 });

			console.log(`Stored on Firebase!`);
		}

		await interaction.editReply(`Activities found: ${activities[0]}`);
	},
};


// console.log(`createdAt: ${userPlaying?.map((act) => act.createdAt).join(',')}`);
// console.log(`createdTimestamp: ${userPlaying?.map((act) => act.createdTimestamp).join(',')}`);
// console.log(`Timestamps: ${userPlaying?.map((act) => `${act.timestamps.start} - ${act.timestamps.end}`).join(',')}`);