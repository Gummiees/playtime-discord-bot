const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { Timer } = require('./models/timer');
const { storeActivity } = require('./database/storeActivity');
const { pushTimer, removeTimer, findTimer } = require('./timers');
const moment = require('moment');


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

function addActivity(presence, activity) {
  const timer = findTimer(presence.userId, activity.applicationId);
  if(timer) {
    throw new Error(`There already is a timer the activity ${activity} and the user ${presence.userId}`);
  }

  const timestamp = moment().format('X');
  pushTimer(new Timer(presence.userId, activity.applicationId, activity.name, timestamp));
}

async function stopActivity(presence, activity) {
  const timer = findTimer(presence.userId, activity.applicationId);
  if(!timer) {
    throw new Error(`No timer found for the activity ${activity} and the user ${presence.userId}`);
  }
  await storeActivity(timer);
  removeTimer(timer);
}


// Important! If you have one game opened, and you start another one, discord will send on the old presence the game you were initially
// playing, but omit it on the new presence. The new presence will only inform about the new game started, even if the first game is still
// running. Basically, it works as it is being shown on the discord interface.
// https://discord.js.org/docs/packages/discord.js/14.15.3/Client:Class#presenceUpdate
client.on("presenceUpdate", async (oldPresence, newPresence) => {
  try {
		const oldPresenceActivities = oldPresence.activities.filter((act) => act.type == 0);
		const newPresenceActivities = newPresence.activities.filter((act) => act.type == 0);

    
    
    if(oldPresenceActivities.length === newPresenceActivities.length) {
      if(oldPresenceActivities.length === 0) {
        console.log(`No game activities neither on old or new presence`);
        return;
      }
      
      const stoppedActivity = oldPresenceActivities[0];
      const newActivity = newPresenceActivities[0];
      if (stoppedActivity.applicationId === newActivity.applicationId) {
        console.log(`No game activities neither on old or new presence`);
        return;
      }

      // Somehow, the user has stopped the game and started a new one at the exact same moment... just in case...

      console.log(`Stopped playing ${stoppedActivity} AND started playing ${newActivity}`);
      addActivity(newPresence, newActivity);
      await stopActivity(oldPresence, stoppedActivity);
    }

    if(oldPresenceActivities.length >= newPresenceActivities.length) {
      const stoppedActivity = oldPresenceActivities[0];
      console.log(`Stopped playing ${stoppedActivity}`);
      await stopActivity(oldPresence, stoppedActivity);
    }
    if (oldPresenceActivities.length <= newPresenceActivities.length) {
      const newActivity = newPresenceActivities[0];
      console.log(`Started playing ${newActivity}`);
      addActivity(newPresence, newActivity);
    }
  }
  catch (err) {
    console.error(err);
  }
});

client.login(process.env.DISCORD_TOKEN);

/** FIRESTORE */
initializeApp({ credential: applicationDefault() });
console.log(`Firebase initialized!`);