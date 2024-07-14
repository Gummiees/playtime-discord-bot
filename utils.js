const moment = require('moment');

function calculateTime(timer) {
    console.log(`original timestamp: ${timer.time}`);
    const originalTime = moment(timer.time, 'X');
    const timeSpentInSeconds = moment().diff(originalTime, 's');
    console.log(`timeSpentInSeconds: ${timeSpentInSeconds}`);
    return timeSpentInSeconds;
}

function getRange(timeInSeconds) {
	return moment.preciseDiff(moment(), moment().add(timeInSeconds, 's'));
}

module.exports = {
    calculateTime,
    getRange,
}