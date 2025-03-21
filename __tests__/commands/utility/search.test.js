const { getActivities } = require('../../../database/getActivities');
const { findTimer } = require('../../../timers');
const { calculateTime } = require('../../../utils');
const { NoUserError } = require('../../../database/exceptions/noUserError');
const searchCommand = require('../../../commands/utility/search');
const { SlashCommandBuilder } = require('discord.js');

jest.mock('../../../database/getActivities');
jest.mock('../../../timers');
jest.mock('../../../utils');
jest.mock('discord.js');

describe('Search Command', () => {
  let mockInteraction;
  let mockUser;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock user
    mockUser = {
      id: '123456789',
      username: 'TestUser'
    };

    // Setup mock interaction
    mockInteraction = {
      user: mockUser,
      options: {
        getString: jest.fn()
      },
      reply: jest.fn(),
      editReply: jest.fn(),
      deferReply: jest.fn()
    };

    findTimer.mockReturnValue(null);
    calculateTime.mockReturnValue(0);
  });

  it('should search games by name', async () => {
    // Arrange
    const mockGames = [
      { id: '1', name: 'Game 1', time: 100 },
      { id: '2', name: 'Game 2', time: 200 }
    ];
    mockInteraction.options.getString.mockReturnValue('Game');
    getActivities.mockResolvedValue(mockGames);

    // Act
    await searchCommand.execute(mockInteraction);

    // Assert
    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(getActivities).toHaveBeenCalledWith(mockUser.id);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Game 1')
    );
  });

  it('should handle case-insensitive search', async () => {
    // Arrange
    const mockGames = [
      { id: '1', name: 'Game 1', time: 100 },
      { id: '2', name: 'game 2', time: 200 }
    ];
    mockInteraction.options.getString.mockReturnValue('game');
    getActivities.mockResolvedValue(mockGames);

    // Act
    await searchCommand.execute(mockInteraction);

    // Assert
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Game 1')
    );
  });

  it('should handle NoUserError', async () => {
    // Arrange
    mockInteraction.options.getString.mockReturnValue('Game');
    getActivities.mockRejectedValue(new NoUserError('User not found'));

    // Act
    await searchCommand.execute(mockInteraction);

    // Assert
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('You have no games registered')
    );
  });

  it('should handle empty games array', async () => {
    // Arrange
    mockInteraction.options.getString.mockReturnValue('Game');
    getActivities.mockResolvedValue([]);

    // Act
    await searchCommand.execute(mockInteraction);

    // Assert
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('You have no games registered')
    );
  });

  it('should return no games message when user has no games', async () => {
    mockInteraction.options.getString.mockReturnValue('test');
    getActivities.mockRejectedValue(new NoUserError());

    await searchCommand.execute(mockInteraction);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'You have no games registered.'
    );
  });

  it('should return no matches message when search has no results', async () => {
    mockInteraction.options.getString.mockReturnValue('nonexistent');
    getActivities.mockResolvedValue([
      { id: '1', name: 'Game 1', time: 100 },
      { id: '2', name: 'Game 2', time: 200 }
    ]);

    await searchCommand.execute(mockInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'No games found matching "nonexistent".'
    );
  });

  it('should return matching games with their playtime', async () => {
    mockInteraction.options.getString.mockReturnValue('game');
    getActivities.mockResolvedValue([
      { id: '1', name: 'Game 1', time: 100 },
      { id: '2', name: 'Game 2', time: 200 },
      { id: '3', name: 'Other', time: 300 }
    ]);

    await searchCommand.execute(mockInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Game 1')
    );
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Game 2')
    );
    expect(mockInteraction.editReply).not.toHaveBeenCalledWith(
      expect.stringContaining('Other')
    );
  });

  it('should include active timer time in total playtime', async () => {
    mockInteraction.options.getString.mockReturnValue('game');
    getActivities.mockResolvedValue([
      { id: '1', name: 'Game 1', time: 100 }
    ]);
    findTimer.mockReturnValue({ id: '1', time: 1234567890 });
    calculateTime.mockReturnValue(50);

    await searchCommand.execute(mockInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Game 1')
    );
    expect(calculateTime).toHaveBeenCalledWith({ id: '1', time: 1234567890 });
  });

  it('should handle generic errors gracefully', async () => {
    mockInteraction.options.getString.mockReturnValue('test');
    getActivities.mockRejectedValue(new Error('Database error'));

    await searchCommand.execute(mockInteraction);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'There was an error while searching for games.'
    );
  });
}); 