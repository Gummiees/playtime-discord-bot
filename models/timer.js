class Timer {
    constructor(userId, id, name, time, type = 0) {
        this.userId = userId;
        this.id = id;
        this.name = name;
        this.time = time;
        this.type = type;
    }
}

module.exports = { Timer };