const { getFirestore } = require('firebase-admin/firestore');
const { logError } = require('../logger');

/**
 * Stores a custom activity in the database to be tracked automatically
 */
async function storeTrackedActivity(userId, activityName, activityType) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const trackedActivitiesRef = userRef.collection('trackedActivities');

    try {
        await trackedActivitiesRef.doc(activityName).set({
            name: activityName,
            type: activityType,
            createdAt: new Date()
        });
    } catch (error) {
        logError(`Error storing tracked activity for user ${userId}: ${error.message}`);
        throw error;
    }
}

/**
 * Gets all tracked activities for a user
 */
async function getTrackedActivities(userId) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const trackedActivitiesRef = userRef.collection('trackedActivities');

    try {
        const snapshot = await trackedActivitiesRef.get();
        return snapshot.docs.map(doc => ({
            name: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        logError(`Error getting tracked activities for user ${userId}: ${error.message}`);
        throw error;
    }
}

/**
 * Checks if an activity is being tracked for a user
 */
async function isActivityTracked(userId, activityName) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const activityRef = userRef.collection('trackedActivities').doc(activityName);

    try {
        const doc = await activityRef.get();
        return doc.exists;
    } catch (error) {
        logError(`Error checking tracked activity for user ${userId}: ${error.message}`);
        throw error;
    }
}

module.exports = {
    storeTrackedActivity,
    getTrackedActivities,
    isActivityTracked
}; 