const { SlashCommandBuilder } = require('discord.js');
const { storeActivity } = require('../../database/storeActivity');
const { storeTrackedActivity } = require('../../database/trackedActivities');
const { logError } = require('../../logger');
const { Timer } = require('../../models/timer');
const moment = require('moment');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('track-activity')
        .setDescription('Start tracking a non-game activity that is currently active on your profile'),
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            console.log(`[DEBUG] Starting track-activity command execution for user ${userId}`);
            
            try {
                await interaction.deferReply({ ephemeral: true });
                console.log(`[DEBUG] Successfully deferred reply`);
            } catch (deferError) {
                console.error(`[DEBUG] Error deferring reply:`, deferError);
                throw deferError;
            }
            
            // Get the user's current activities from their presence
            const presence = interaction.member.presence;
            if (!presence || !presence.activities || presence.activities.length === 0) {
                console.log(`[DEBUG] No activities found for user ${userId}`);
                return await interaction.editReply('You don\'t have any active activities to track. Start an activity first!');
            }

            console.log(`[DEBUG] Found ${presence.activities.length} activities:`, 
                JSON.stringify(presence.activities.map(a => ({
                    name: a.name,
                    type: a.type,
                    id: a.applicationId,
                    state: a.state,
                    details: a.details,
                    isCustomActivity: !a.applicationId && a.type === 0
                })), null, 2));

            // Filter out "Custom Status" activities and identify custom activities
            const realActivities = presence.activities.filter(activity => {
                // Filter out the generic "Custom Status"
                if (activity.type === 4 && activity.name === 'Custom Status') {
                    return false;
                }
                return true;
            });

            console.log(`[DEBUG] Found ${realActivities.length} real activities after filtering Custom Status:`, 
                JSON.stringify(realActivities.map(a => ({
                    name: a.name,
                    type: a.type,
                    id: a.applicationId,
                    isCustomActivity: !a.applicationId && a.type === 0
                })), null, 2));

            // Separate game and non-game activities
            // A real game should have type 0 AND an applicationId
            const gameActivities = realActivities.filter(activity => 
                activity.type === 0 && activity.applicationId
            );
            
            // Non-game activities include custom activities (type 0 without applicationId) and other types
            const nonGameActivities = realActivities.filter(activity => 
                activity.type !== 0 || (activity.type === 0 && !activity.applicationId)
            );
            
            console.log(`[DEBUG] Found ${gameActivities.length} game activities:`,
                JSON.stringify(gameActivities.map(a => ({
                    name: a.name,
                    type: a.type,
                    id: a.applicationId
                })), null, 2));
            
            console.log(`[DEBUG] Found ${nonGameActivities.length} non-game activities:`,
                JSON.stringify(nonGameActivities.map(a => ({
                    name: a.name,
                    type: a.type,
                    id: a.applicationId
                })), null, 2));

            if (nonGameActivities.length === 0) {
                const message = gameActivities.length > 0 
                    ? `You only have game activities (${gameActivities.map(g => g.name).join(', ')}), which are tracked automatically!`
                    : 'You don\'t have any non-game activities to track. Note that games are tracked automatically!';
                
                console.log(`[DEBUG] Sending response: ${message}`);
                return await interaction.editReply(message);
            }

            // For now, we'll track the first non-game activity found
            const activityToTrack = nonGameActivities[0];
            console.log(`[DEBUG] Selected activity to track:`, JSON.stringify({
                name: activityToTrack.name,
                type: activityToTrack.type,
                id: activityToTrack.applicationId,
                state: activityToTrack.state,
                details: activityToTrack.details,
                isCustomActivity: !activityToTrack.applicationId && activityToTrack.type === 0
            }, null, 2));
            
            try {
                // Store the activity in the tracked activities collection
                console.log(`[DEBUG] Storing activity in tracked activities...`);
                await storeTrackedActivity(userId, activityToTrack.name, activityToTrack.type);
                console.log(`[DEBUG] Activity stored in tracked activities successfully`);
            } catch (storeError) {
                console.error(`[DEBUG] Error storing tracked activity:`, storeError);
                throw storeError;
            }

            // Create a timer object for the activity
            const activityId = activityToTrack.applicationId || activityToTrack.name;
            const timer = new Timer(
                userId,
                activityId,
                activityToTrack.name,
                moment().format('X'),
                activityToTrack.type
            );
            
            console.log(`[DEBUG] Created timer:`, JSON.stringify(timer, null, 2));
            
            try {
                // Store the activity's current session
                console.log(`[DEBUG] Storing activity session...`);
                await storeActivity(timer);
                console.log(`[DEBUG] Activity session stored successfully`);
            } catch (storeError) {
                console.error(`[DEBUG] Error storing activity session:`, storeError);
                throw storeError;
            }

            const successMessage = `Started tracking activity: **${activityToTrack.name}**. This activity will now be tracked automatically whenever you use it.`;
            console.log(`[DEBUG] Sending success message: ${successMessage}`);
            return await interaction.editReply(successMessage);
        } catch (error) {
            console.error(`[DEBUG] Error in track-activity:`, error);
            console.error(`[DEBUG] Error stack:`, error.stack);
            logError(`Error in track-activity command for user ${userId}: ${error.message}\nStack: ${error.stack}`);
            
            const errorMessage = 'There was an error while trying to track your activity.';
            try {
                if (interaction.deferred) {
                    console.log(`[DEBUG] Sending error response via editReply`);
                    return await interaction.editReply(errorMessage);
                } else {
                    console.log(`[DEBUG] Sending error response via reply`);
                    return await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            } catch (responseError) {
                console.error(`[DEBUG] Error sending error response:`, responseError);
                throw responseError;
            }
        }
    }
}; 