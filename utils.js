const moment = require('moment');

function calculateTime(timer) {
    const originalTime = moment(timer.time, 'X');
    const timeSpentInSeconds = moment().diff(originalTime, 's');
    return timeSpentInSeconds;
}

function getRange(timeInSeconds) {
	return moment.preciseDiff(moment(), moment().add(timeInSeconds, 's'));
}

module.exports = {
    calculateTime,
    getRange,
}