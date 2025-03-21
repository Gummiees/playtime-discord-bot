const { Logging } = require('@google-cloud/logging');

// Mock the Google Cloud Logging module
jest.mock('@google-cloud/logging');

// Setup mock chain
const mockEntry = jest.fn().mockReturnValue('mock-entry');
const mockWrite = jest.fn().mockResolvedValue();
const mockLog = {
  entry: mockEntry,
  write: mockWrite
};

// Mock the Logging constructor and its methods
Logging.mockImplementation(() => ({
  log: jest.fn().mockReturnValue(mockLog)
}));

const { logInfo, logError } = require('../logger');

describe('Logger', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
  });

  it('should log message to console', async () => {
    const message = 'Test log message';
    await logInfo(message);
    expect(console.log).toHaveBeenCalledWith(message);
  });

  it('should create log entry with correct metadata', async () => {
    const message = 'Test log message';
    await logInfo(message);

    expect(mockEntry).toHaveBeenCalledWith(
      {
        resource: { type: 'global' },
        severity: 'INFO'
      },
      message
    );
  });

  it('should write log entry to Google Cloud Logging', async () => {
    const message = 'Test log message';
    await logInfo(message);

    expect(mockWrite).toHaveBeenCalledWith('mock-entry');
  });

  it('should handle errors gracefully', async () => {
    mockWrite.mockRejectedValue(new Error('Logging failed'));

    const message = 'Test log message';
    await logInfo(message);

    expect(console.error).toHaveBeenCalled();
  });

  describe('logError', () => {
    test('should log error to console and Google Cloud Logging', async () => {
      // Arrange
      const errorText = 'Test error message';

      // Act
      await logError(errorText);

      // Assert
      expect(console.error).toHaveBeenCalledWith(errorText);
      expect(mockEntry).toHaveBeenCalledWith(
        {
          resource: { type: 'global' },
          severity: 'ERROR'
        },
        errorText
      );
      expect(mockWrite).toHaveBeenCalledWith('mock-entry');
    });

    test('should handle Google Cloud Logging write failure', async () => {
      // Arrange
      const errorText = 'Test error message';
      const mockError = new Error('Failed to write to Google Cloud Logging');
      mockWrite.mockRejectedValue(mockError);

      // Act
      await logError(errorText);

      // Assert
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenNthCalledWith(1, errorText);
      expect(console.error).toHaveBeenNthCalledWith(2, 'Failed to write to Google Cloud Logging:', mockError);
      expect(mockEntry).toHaveBeenCalledWith(
        {
          resource: { type: 'global' },
          severity: 'ERROR'
        },
        errorText
      );
      expect(mockWrite).toHaveBeenCalledWith('mock-entry');
    });
  });
}); 