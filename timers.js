const timers = [];

function pushTimer(timer) {
    timers.push(timer);
    console.log(`Total timers: ${timers.length}`);
}

function removeTimer(timer) {
  const index = timers.indexOf(timer);
  timers.splice(index, 1);
  console.log(`Total timers: ${timers.length}`);
}

function findTimer(userId, gameId) {
  return timers.find((timer) => timer.userId === userId && timer.id === gameId);
}

module.exports = {
    pushTimer,
    removeTimer,
    findTimer,
}