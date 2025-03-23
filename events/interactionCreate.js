const { Events, Collection } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
            const { cooldowns } = interaction.client;
            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }
    
            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
    
            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            
                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1_000);
                    return interaction.reply({ 
                        content: `Please wait, you are on a cooldown for '${command.data.name}'.`,
                        ephemeral: true 
                    });
                }
            }

			await command.execute(interaction);
    
            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
		} catch (error) {
			console.error('Command execution error:', error);
			
			try {
				const errorMessage = { 
					content: 'There was an error while executing this command!',
					ephemeral: true 
				};

				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply(errorMessage);
				} else {
					await interaction.editReply(errorMessage);
				}
			} catch (followUpError) {
				console.error('Error sending error message:', followUpError);
			}
		}
	},
};