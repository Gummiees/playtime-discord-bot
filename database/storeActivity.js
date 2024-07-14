const { getFirestore } = require('firebase-admin/firestore');
const { calculateTime } = require('../utils');

const storeActivity = async (timer) => {
    const db = getFirestore();
    const userRef = db.collection('users').doc(timer.userId);
    const userDoc = await userRef.get();
    if(!userDoc.exists) {
        await userRef.set({ id: timer.userId });
    }
    
    const gameRef = userRef.collection('games').doc(timer.id);
    const gameDoc = await gameRef.get();
    
    let time = calculateTime(timer);
    if (gameDoc.exists) {
        console.log(`saved time: ${gameDoc.data().time}`);
        time += gameDoc.data().time;
    }
    
    console.log(`total time to be stored: ${time}`);
    await gameRef.set({ id: timer.id, name: timer.name, time: time });
    console.log(`Stored on Firebase!`);
};

module.exports = { storeActivity };