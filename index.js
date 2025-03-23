const fs = require('node:fs');
const path = require('node:path');
const { token } = require('./config.json');
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { Timer } = require('./models/timer');
const { storeActivity } = require('./database/storeActivity');
const { pushTimer, removeTimer, findTimer } = require('./timers');
const { logInfo, logError } = require('./logger');
const moment = require('moment');
const { getTrackingPermissions } = require('./database/trackingPermissions');

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
        logInfo(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
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
	logInfo(`Ready! Logged in as ${readyClient.user.tag}`);
});

async function addActivity(presence, activity) {
  const timer = findTimer(presence.userId, activity.applicationId || activity.name);
  if(timer) {
    throw new Error(`There already is a timer the activity ${activity} and the user ${presence.userId}`);
  }

  const isTrackingEnabled = await getTrackingPermissions(presence.userId);
  if (!isTrackingEnabled) {
    logInfo(`Tracking is disabled for user ${presence.userId}`);
    return;
  }

  const timestamp = moment().format('X');
  pushTimer(new Timer(presence.userId, activity.applicationId || activity.name, activity.name, timestamp, activity.type));
}

async function stopActivity(presence, activity) {
  const timer = findTimer(presence.userId, activity.applicationId || activity.name);
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
    if(!oldPresence) {
      logInfo(`oldPresence is null`);
      return;
    }
    if(!newPresence) {
      logInfo(`newPresence is null`);
      return;
    }

    // Get all tracked activities (games are type 0)
    const oldPresenceActivities = oldPresence.activities.filter((act) => {
      // Check if it's a game (type 0) or if it's being tracked
      const timer = findTimer(oldPresence.userId, act.applicationId || act.name);
      return act.type === 0 || timer !== null;
    });
    const newPresenceActivities = newPresence.activities.filter((act) => {
      // Check if it's a game (type 0) or if it's being tracked
      const timer = findTimer(newPresence.userId, act.applicationId || act.name);
      return act.type === 0 || timer !== null;
    });
    
    if(oldPresenceActivities.length === newPresenceActivities.length) {
      if(oldPresenceActivities.length === 0) {
        logInfo(`No tracked activities in either presence`);
        return;
      }
      
      const stoppedActivity = oldPresenceActivities[0];
      const newActivity = newPresenceActivities[0];
      if (stoppedActivity.applicationId === newActivity.applicationId || 
          (!stoppedActivity.applicationId && stoppedActivity.name === newActivity.name)) {
        logInfo(`No change in tracked activities`);
        return;
      }

      // The user has stopped one activity and started another at the same time
      logInfo(`Stopped ${stoppedActivity.name} AND started ${newActivity.name}`);
      addActivity(newPresence, newActivity);
      await stopActivity(oldPresence, stoppedActivity);
    }

    if(oldPresenceActivities.length >= newPresenceActivities.length) {
      const stoppedActivity = oldPresenceActivities[0];
      logInfo(`Stopped ${stoppedActivity.name}`);
      await stopActivity(oldPresence, stoppedActivity);
    }
    if (oldPresenceActivities.length <= newPresenceActivities.length) {
      const newActivity = newPresenceActivities[0];
      logInfo(`Started ${newActivity.name}`);
      addActivity(newPresence, newActivity);
    }
  }
  catch (err) {
    logError(err);
  }
});

client.login(token);

/** FIRESTORE */
initializeApp({ credential: applicationDefault() });
logInfo(`Firebase initialized!`);