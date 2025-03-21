const {Logging} = require('@google-cloud/logging');

const logging = new Logging({projectId: 'discord-playtime-bot'});
const log = logging.log('my-logs');

async function logInfo(text) {
    const metadata = {
        resource: {type: 'global'},
        severity: 'INFO',
    };
    console.log(text);
    try {
        const entry = log.entry(metadata, text);
        await log.write(entry);
    } catch (error) {
        console.error('Failed to write to Google Cloud Logging:', error);
    }
}

async function logError(text) {
    const metadata = {
        resource: {type: 'global'},
        severity: 'ERROR',
    };
    console.error(text);
    try {
        const entry = log.entry(metadata, text);
        await log.write(entry);
    } catch (error) {
        console.error('Failed to write to Google Cloud Logging:', error);
    }
}

module.exports = { logInfo, logError }