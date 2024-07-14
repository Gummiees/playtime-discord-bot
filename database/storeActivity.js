const { getFirestore } = require('firebase-admin/firestore');
const moment = require('moment');

const storeActivity = async (timer) => {
    console.log(`original timestamp: ${timer.time}`);
    const originalTime = moment(timer.time, 'X');
    const timeSpentInSeconds = moment().diff(originalTime, 's');
    console.log(`timeSpentInSeconds: ${timeSpentInSeconds}`);


    const db = getFirestore();
    const userRef = db.collection('users').doc(timer.userId);
    const userDoc = await userRef.get();
    if(!userDoc.exists) {
        await userRef.set({ id: timer.userId });
    }

    const gameRef = userRef.collection('games').doc(timer.id);
    const gameDoc = await gameRef.get();
    
    let time = timeSpentInSeconds;
    if (gameDoc.exists) {
        console.log(`saved time: ${gameDoc.data().time}`);
        time += gameDoc.data().time;
    }
    
    console.log(`total time to be stored: ${time}`);
    await gameRef.set({ id: timer.id, name: timer.name, time: time });
    console.log(`Stored on Firebase!`);
};

module.exports = { storeActivity };