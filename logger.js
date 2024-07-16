const {Logging} = require('@google-cloud/logging');

const logging = new Logging({projectId: 'discord-playtime-bot'});
const log = logging.log('my-logs');

async function logInfo(text) {
    const metadata = {
        resource: {type: 'global'},
        severity: 'INFO',
    };
    console.log(text);
    const entry = log.entry(metadata, text);
    await log.write(entry);
}

async function logError(text) {
    const metadata = {
        resource: {type: 'global'},
        severity: 'ERROR',
    };
    console.error(text);
    const entry = log.entry(metadata, text);
    await log.write(entry);
}

module.exports = { logInfo, logError }