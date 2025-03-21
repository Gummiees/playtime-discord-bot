const { pushTimer, removeTimer, findTimer, _timers } = require('../timers');
const { Timer } = require('../models/timer');

describe('Timer Management', () => {
  beforeEach(() => {
    // Clear all timers before each test
    _timers.length = 0;
  });

  describe('pushTimer', () => {
    it('should add a new timer to the list', () => {
      const timer = new Timer('123', '456', 'Test Game', '1234567890');
      pushTimer(timer);
      expect(_timers).toContain(timer);
    });

    it('should throw error when adding duplicate timer', () => {
      const timer = new Timer('123', '456', 'Test Game', '1234567890');
      pushTimer(timer);
      expect(() => pushTimer(timer)).toThrow();
    });
  });

  describe('removeTimer', () => {
    it('should remove an existing timer', () => {
      const timer = new Timer('123', '456', 'Test Game', '1234567890');
      pushTimer(timer);
      removeTimer('123', '456');
      expect(_timers).not.toContain(timer);
    });

    it('should not throw error when removing non-existent timer', () => {
      expect(() => removeTimer('123', '456')).not.toThrow();
    });
  });

  describe('findTimer', () => {
    it('should find an existing timer', () => {
      const timer = new Timer('123', '456', 'Test Game', '1234567890');
      pushTimer(timer);
      const found = findTimer('123', '456');
      expect(found).toBe(timer);
    });

    it('should return null when timer does not exist', () => {
      const found = findTimer('123', '456');
      expect(found).toBeNull();
    });
  });
}); 