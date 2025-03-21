const { getFirestore } = require('firebase-admin/firestore');
const { NoUserError } = require('./exceptions/noUserError');
const { logError } = require('../logger');

const getActivities = async (userId) => {
    try {
        const db = getFirestore();
        const userRef = db.collection('users').doc(userId);
        const userSnapshot = await userRef.get();
        if(!userSnapshot.exists) {
            logError(`User ${userId} not found in database`);
            throw new NoUserError();
        }
        
        const snapshot = await userRef.collection('games').get();
        const activities = snapshot.docs.map(doc => doc.data());
        logError(`Successfully retrieved ${activities.length} activities for user ${userId}`);
        return activities;
    } catch (error) {
        logError(`Error in getActivities for user ${userId}: ${error.message}`);
        throw error;
    }
};

module.exports = { getActivities };