const { SlashCommandBuilder } = require('discord.js');
const { getTrackingPermissions, setTrackingPermissions } = require('../../database/trackingPermissions');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('tracking')
        .setDescription('Enable or disable game time tracking for your account')
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('Whether to enable or disable tracking')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const enabled = interaction.options.getBoolean('enabled');

        await interaction.deferReply();
        try {
            await setTrackingPermissions(userId, enabled);
            const currentStatus = await getTrackingPermissions(userId);
            
            if (currentStatus) {
                await interaction.editReply('Game time tracking has been enabled for your account. Your game time will now be tracked.');
            } else {
                await interaction.editReply('Game time tracking has been disabled for your account. Your game time will no longer be tracked.');
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply('There was an error while updating your tracking preferences.');
        }
    },
}; 