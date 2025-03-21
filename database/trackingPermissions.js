const { getFirestore } = require('firebase-admin/firestore');

const getTrackingPermissions = async (userId) => {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        return false; // Default to not tracking
    }
    
    return userDoc.data().trackingEnabled ?? false;
};

const setTrackingPermissions = async (userId, enabled) => {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        await userRef.set({ id: userId, trackingEnabled: enabled });
    } else {
        await userRef.update({ trackingEnabled: enabled });
    }
};

module.exports = { getTrackingPermissions, setTrackingPermissions }; 