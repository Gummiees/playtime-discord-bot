const { logInfo } = require('./logger');

const timers = [];

function pushTimer(timer) {
    // Check if a timer with the same userId and gameId already exists
    const existingTimer = findTimer(timer.userId, timer.id);
    if (existingTimer) {
        throw new Error(`Timer already exists for user ${timer.userId} and game ${timer.id}`);
    }
    
    timers.push(timer);
    logInfo(`Total timers: ${timers.length}`);
}

function removeTimer(timer) {
  const index = timers.indexOf(timer);
  timers.splice(index, 1);
  logInfo(`Total timers: ${timers.length}`);
}

function findTimer(userId, gameId) {
  const timer = timers.find((timer) => timer.userId === userId && timer.id === gameId);
  return timer || null;
}

module.exports = {
    pushTimer,
    removeTimer,
    findTimer,
    // Export timers array for testing
    _timers: timers
}