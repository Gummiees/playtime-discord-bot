// import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
// import { getFirestore, Timestamp, FieldValue, Filter } from 'firebase-admin/firestore';

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