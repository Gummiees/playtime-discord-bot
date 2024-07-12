const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
// import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
// import { getFirestore, Timestamp, FieldValue, Filter } from 'firebase-admin/firestore';

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


// Read commands
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

// Read events
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

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// const config = {
//   apiKey: process.env.FIREBASE_API_KEY,
//   authDomain: "discord-playtime-bot.firebaseapp.com",
//   projectId: "discord-playtime-bot",
//   storageBucket: "discord-playtime-bot.appspot.com",
//   messagingSenderId: "530075838134",
//   appId: "1:530075838134:web:88beb63146df4d860fe817",
//   databaseURL: "https://PROJECT_ID.firebaseio.com",
// };


// initializeApp(config);
// const db = getFirestore();

function getTimePerGame(snapshot) {
  var totalTime = 0;
  snapshot.forEach(doc => {
    // TODO: how to get data.time?
    totalTime += doc.data().time;
  });
  return [];
}

class Game {
  constructor(id, name, time) {
    this.id = id;
    this.name = name;
    this.time = time;
  }
}

// function setTimeToGame(userId, gameId, gameName, timeSpentNow) {
//   const usersRef = db.collection('users');
//   const gameRef = usersRef.doc(userId).collection('games').doc(gameId);
//   const gameDoc = await gameRef.get();
//   var currentTime = 0;
//   if (gameDoc.exists) {
//     currentTime = gameDoc.data().time;
//   }

//   await gameRef.set({ name: 'game-name', time: currentTime + timeSpentNow });
// }


 client.on("message", async message => {
  if (message.author === client.user) {
    return;
  }
  try {
    await client.channels.cache.get(`CHANNEL_ID`).send(`Testing!`);
    // const userId = message.author.id;
    // const usersRef = db.collection('users');
    // const userDoc = await usersRef.get(userId);
    // // TODO: skip if it's already set
    // await userDoc.set({ id: userId });

    // //get times
    // // TODO: move to somewhere else
    // const snapshot = await userDoc.collection('games').get();
    // if (snapshot.empty) {
    //   await client.channels.cache.get(`CHANNEL_ID`).send('You have no time spent on times registered yet.');
    //   return;
    // }

    // const timePerGameArray = getTimePerGame(snapshot);
    // const timeGameStringArray = timePerGameArray.map((gameTime) => `${gameTime.game}: ${gameTime.time}`);
    // await client.channels.cache.get(`CHANNEL_ID`).send(`These are the games and times you've spent on them:\n\n${timeGameStringArray.join('\n')}`);


    // // set time
    // const gameRef = usersRef.doc(userId).collection('games').doc('game-id');
    // const doc = await gameRef.get();
    // if (!doc.exists) {
    //   console.log('No such document!');
    // } else {
    //   console.log('Document data:', doc.data());
    // }

    // await gameRef.set({ name: 'game-name', time: ? });
    
    // firebase.database().goOffline();
    // await client.channels.cache.get(`CHANNEL_ID`).send(`Thanks for the feedback. This is your Support Ticket Number ${ticket} We\'ll let Dabble Lab know! `);
  }
  
  catch (err) {
    console.log(err);
  }

}
);

client.login(process.env.DISCORD_TOKEN);

