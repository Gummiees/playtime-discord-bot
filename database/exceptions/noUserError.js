class NoUserError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NoUserError';
    }
}

module.exports = { NoUserError };