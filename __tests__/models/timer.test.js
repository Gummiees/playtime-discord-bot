const { Timer } = require('../../models/timer');

describe('Timer Model', () => {
    it('should create a timer with default type', () => {
        const timer = new Timer('user123', 'game456', 'Game Name', 1234567890);
        
        expect(timer.userId).toBe('user123');
        expect(timer.id).toBe('game456');
        expect(timer.name).toBe('Game Name');
        expect(timer.time).toBe(1234567890);
        expect(timer.type).toBe(0); // Default type (game)
    });

    it('should create a timer with specified type', () => {
        const timer = new Timer('user123', 'spotify456', 'Spotify', 1234567890, 2);
        
        expect(timer.userId).toBe('user123');
        expect(timer.id).toBe('spotify456');
        expect(timer.name).toBe('Spotify');
        expect(timer.time).toBe(1234567890);
        expect(timer.type).toBe(2); // Listening type
    });
}); 