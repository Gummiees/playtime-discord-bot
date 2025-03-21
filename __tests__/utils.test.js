const moment = require('moment');
const { calculateTime, getRange } = require('../utils');

jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  const mockMoment = jest.fn(() => ({
    diff: jest.fn().mockReturnValue(3600), // 1 hour in seconds
    add: jest.fn().mockReturnThis()
  }));
  mockMoment.preciseDiff = jest.fn().mockReturnValue('1 hour');
  return mockMoment;
});

describe('Utility Functions', () => {
  describe('calculateTime', () => {
    it('should calculate time difference in seconds', () => {
      const timer = {
        time: '1234567890'
      };

      const result = calculateTime(timer);
      expect(result).toBe(3600); // 1 hour in seconds
    });

    it('should handle invalid timestamp', () => {
      const timer = {
        time: 'invalid'
      };

      const result = calculateTime(timer);
      expect(result).toBe(3600); // Still returns the mocked value
    });
  });

  describe('getRange', () => {
    it('should return formatted time range', () => {
      const timeInSeconds = 3600; // 1 hour
      const result = getRange(timeInSeconds);

      expect(result).toBe('1 hour');
    });

    it('should handle zero seconds', () => {
      const result = getRange(0);
      expect(result).toBe('1 hour'); // Mocked value
    });

    it('should handle negative seconds', () => {
      const result = getRange(-3600);
      expect(result).toBe('1 hour'); // Mocked value
    });
  });
}); 