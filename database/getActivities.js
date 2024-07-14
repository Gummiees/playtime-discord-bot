const { getFirestore } = require('firebase-admin/firestore');
const { NoUserError } = require('./exceptions/noUserError');

const getActivities = async (userId) => {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userSnapshot = await userRef.get();
    if(!userSnapshot.exists) {
        throw new NoUserError();
    }
    
    const snapshot = await userRef.collection('games').get();
    return snapshot.docs.map(doc => doc.data());
};

module.exports = { getActivities };