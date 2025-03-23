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
const { isActivityTracked } = require('./database/trackedActivities');

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
client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
  try {
    // Check if the user has tracking enabled
    const isTrackingEnabled = await getTrackingPermissions(newPresence.userId);
    if (!isTrackingEnabled) {
      return;
    }

    // Get the activities that were stopped (present in old but not in new)
    const oldActivities = oldPresence?.activities || [];
    const newActivities = newPresence?.activities || [];
    
    const stoppedActivities = oldActivities.filter(oldActivity => {
      return !newActivities.some(newActivity => {
        // For games, compare by applicationId
        if (oldActivity.type === 0 && oldActivity.applicationId) {
          return newActivity.applicationId === oldActivity.applicationId;
        }
        // For non-games, compare by name
        return newActivity.name === oldActivity.name;
      });
    });

    // Handle stopped activities
    for (const activity of stoppedActivities) {
      try {
        // Skip "Custom Status" activities
        if (activity.type === 4 && activity.name === 'Custom Status') {
          continue;
        }

        // For games (type 0 with applicationId) or tracked custom activities
        if ((activity.type === 0 && activity.applicationId) || 
            await isActivityTracked(newPresence.userId, activity.name)) {
          await stopActivity(newPresence, activity);
        }
      } catch (error) {
        logError(`Error stopping activity ${activity.name} for user ${newPresence.userId}: ${error.message}`);
      }
    }

    // Get the activities that were started (present in new but not in old)
    const startedActivities = newActivities.filter(newActivity => {
      return !oldActivities.some(oldActivity => {
        // For games, compare by applicationId
        if (newActivity.type === 0 && newActivity.applicationId) {
          return oldActivity.applicationId === newActivity.applicationId;
        }
        // For non-games, compare by name
        return oldActivity.name === newActivity.name;
      });
    });

    // Handle started activities
    for (const activity of startedActivities) {
      try {
        // Skip "Custom Status" activities
        if (activity.type === 4 && activity.name === 'Custom Status') {
          continue;
        }

        // For games (type 0 with applicationId) or tracked custom activities
        if ((activity.type === 0 && activity.applicationId) || 
            await isActivityTracked(newPresence.userId, activity.name)) {
          const timer = new Timer(
            newPresence.userId,
            activity.applicationId || activity.name,
            activity.name,
            moment().format('X'),
            activity.type
          );
          pushTimer(timer);
        }
      } catch (error) {
        logError(`Error starting activity ${activity.name} for user ${newPresence.userId}: ${error.message}`);
      }
    }
  } catch (error) {
    logError(`Error in presence update handler: ${error.message}`);
  }
});

client.login(token);

/** FIRESTORE */
initializeApp({ credential: applicationDefault() });
logInfo(`Firebase initialized!`);