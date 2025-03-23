const { logInfo } = require('./logger');

const timers = [];

function pushTimer(timer) {
    console.log(`[DEBUG] Pushing timer:`, timer);
    // Check if a timer with the same userId and gameId already exists
    const existingTimer = findTimer(timer.userId, timer.id);
    if (existingTimer) {
        console.log(`[DEBUG] Timer already exists:`, existingTimer);
        throw new Error(`Timer already exists for user ${timer.userId} and game ${timer.id}`);
    }
    
    timers.push(timer);
    console.log(`[DEBUG] Timer pushed successfully. Total timers: ${timers.length}`);
    logInfo(`Total timers: ${timers.length}`);
}

function removeTimer(timer) {
    console.log(`[DEBUG] Removing timer:`, timer);
    const index = timers.indexOf(timer);
    timers.splice(index, 1);
    console.log(`[DEBUG] Timer removed successfully. Total timers: ${timers.length}`);
    logInfo(`Total timers: ${timers.length}`);
}

function findTimer(userId, gameId) {
    console.log(`[DEBUG] Finding timer for user ${userId} and game ${gameId}`);
    const timer = timers.find((timer) => timer.userId === userId && timer.id === gameId);
    console.log(`[DEBUG] Timer found:`, timer);
    return timer || null;
}

module.exports = {
    pushTimer,
    removeTimer,
    findTimer,
    // Export timers array for testing
    _timers: timers
}