const { SlashCommandBuilder } = require('discord.js');
const { storeActivity } = require('../../database/storeActivity');
const { logError } = require('../../logger');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('track-activity')
        .setDescription('Start tracking a non-game activity that is currently active on your profile'),
    async execute(interaction) {
        const userId = interaction.user.id;
        await interaction.deferReply();

        try {
            // Get the user's current activities from their presence
            const presence = interaction.member.presence;
            if (!presence || !presence.activities || presence.activities.length === 0) {
                await interaction.editReply('You don\'t have any active activities to track. Start an activity first!');
                return;
            }

            // Filter out game activities (type 0) as they are already tracked automatically
            const nonGameActivities = presence.activities.filter(activity => activity.type !== 0);
            
            if (nonGameActivities.length === 0) {
                await interaction.editReply('You don\'t have any non-game activities to track. Note that games are tracked automatically!');
                return;
            }

            // For now, we'll track the first non-game activity found
            const activityToTrack = nonGameActivities[0];
            
            // Store the activity with a special flag indicating it's a non-game activity
            await storeActivity(userId, {
                id: activityToTrack.applicationId || activityToTrack.name, // Fallback to name if no applicationId
                name: activityToTrack.name,
                time: 0,
                type: activityToTrack.type
            });

            await interaction.editReply(`Started tracking activity: **${activityToTrack.name}**. Your time spent on this activity will now be recorded.`);
        } catch (error) {
            logError(`Error in track-activity command for user ${userId}: ${error.message}`);
            await interaction.editReply('There was an error while trying to track your activity.');
        }
    },
}; 