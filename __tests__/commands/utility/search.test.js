const { getActivities } = require('../../../database/getActivities');
const { findTimer } = require('../../../timers');
const { calculateTime } = require('../../../utils');
const { NoUserError } = require('../../../database/exceptions/noUserError');
const searchCommand = require('../../../commands/utility/search');

jest.mock('../../../database/getActivities');
jest.mock('../../../timers');
jest.mock('../../../utils');

describe('Search Command', () => {
  let mockInteraction;

  beforeEach(() => {
    mockInteraction = {
      user: { id: '123' },
      options: {
        getString: jest.fn()
      },
      deferReply: jest.fn(),
      editReply: jest.fn()
    };

    findTimer.mockReturnValue(null);
    calculateTime.mockReturnValue(0);
  });

  it('should return no games message when user has no games', async () => {
    mockInteraction.options.getString.mockReturnValue('test');
    getActivities.mockRejectedValue(new NoUserError());

    await searchCommand.execute(mockInteraction);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'You have no games registered.'
    );
  });

  it('should return no games message when user has empty games list', async () => {
    mockInteraction.options.getString.mockReturnValue('test');
    getActivities.mockResolvedValue([]);

    await searchCommand.execute(mockInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'You have no games registered.'
    );
  });

  it('should return no matches message when no games match the search', async () => {
    mockInteraction.options.getString.mockReturnValue('xyz');
    getActivities.mockResolvedValue([
      { id: '1', name: 'Game 1', time: 100 }
    ]);

    await searchCommand.execute(mockInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      '🔍 No games found matching "**xyz**".'
    );
  });

  it('should return matching games sorted by playtime', async () => {
    mockInteraction.options.getString.mockReturnValue('game');
    getActivities.mockResolvedValue([
      { id: '1', name: 'Game 1', time: 100 },
      { id: '2', name: 'Game 2', time: 300 },
      { id: '3', name: 'Game 3', time: 200 },
      { id: '4', name: 'Other', time: 400 }
    ]);

    await searchCommand.execute(mockInteraction);

    const reply = mockInteraction.editReply.mock.calls[0][0];
    expect(reply).toContain('🔍 **Search Results for "game"**');
    expect(reply).toContain('📊 Found **3** games');
    expect(reply).toContain('Total Playtime:');
    
    const lines = reply.split('\n');
    expect(lines.find(line => line.includes('Game 2'))).toContain('🥇');
    expect(lines.find(line => line.includes('Game 3'))).toContain('🥈');
    expect(lines.find(line => line.includes('Game 1'))).toContain('🥉');
    expect(reply).not.toContain('Other');
  });

  it('should include active timer time in total playtime', async () => {
    mockInteraction.options.getString.mockReturnValue('game');
    getActivities.mockResolvedValue([
      { id: '1', name: 'Game 1', time: 100 }
    ]);
    findTimer.mockReturnValue({ id: '1', time: 1234567890 });
    calculateTime.mockReturnValue(50);

    await searchCommand.execute(mockInteraction);

    const reply = mockInteraction.editReply.mock.calls[0][0];
    expect(reply).toContain('🥇 **Game 1**');
    expect(reply).toContain('⏰');
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