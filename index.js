const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { initializeApp, applicationDefault } = require('firebase-admin/app');


function readCommands(client) {
  const foldersPath = path.join(__dirname, 'commands');
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      // Set a new item in the Collection with the key as the command name and the value as the exported module
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }
}

function readEvents(client) {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}

const client = new Client({
  intents: [
		GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ]
});

client.commands = new Collection();
client.cooldowns = new Collection();


readCommands(client);
readEvents(client);

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Important! If you have one game opened, and you start another one, discord will send on the old presence the game you were initially
// playing, but omit it on the new presence. The new presence will only inform about the new game started, even if the first game is still
// running. Basically, it works as it is being shown on the discord interface.
client.on("presenceUpdate", async (oldPresence, newPresence) => {
  try {
		const oldPresenceActivities = oldPresence.activities.filter((act) => act.type == 0);
		const newPresenceActivities = newPresence.activities.filter((act) => act.type == 0);
    
    if(oldPresenceActivities.length === 0 && newPresenceActivities.length === 0) {
      console.log(`No activities neither on old or new presence`);
      return;
    }

    if(oldPresenceActivities.length >= newPresenceActivities.length) {
      // Stopped playing
      console.log(`Stopped playing ${oldPresenceActivities[0]}`);
    }
    if (oldPresenceActivities.length <= newPresenceActivities.length) {
      // Started playing
      console.log(`Started playing ${newPresenceActivities[0]}`);
    }
  }
  catch (err) {
    console.log(err);
  }
});

client.login(process.env.DISCORD_TOKEN);

/** FIRESTORE */
initializeApp({ credential: applicationDefault() });
console.log(`Firebase initialized!`);