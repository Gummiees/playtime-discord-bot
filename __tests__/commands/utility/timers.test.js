const { getActivities } = require('../../../database/getActivities');
const { findTimer } = require('../../../timers');
const { calculateTime } = require('../../../utils');
const { NoUserError } = require('../../../database/exceptions/noUserError');
const timersCommand = require('../../../commands/utility/timers');

jest.mock('../../../database/getActivities');
jest.mock('../../../timers');
jest.mock('../../../utils');

describe('Timers Command', () => {
  let mockInteraction;

  beforeEach(() => {
    mockInteraction = {
      user: { id: '123' },
      deferReply: jest.fn(),
      editReply: jest.fn()
    };

    findTimer.mockReturnValue(null);
    calculateTime.mockReturnValue(0);
  });

  it('should return no games message when user has no games', async () => {
    getActivities.mockRejectedValue(new NoUserError());

    await timersCommand.execute(mockInteraction);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'You have no games registered.'
    );
  });

  it('should return no games message when user has empty games list', async () => {
    getActivities.mockResolvedValue([]);

    await timersCommand.execute(mockInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'You have no games registered.'
    );
  });

  it('should return list of games with their playtime', async () => {
    getActivities.mockResolvedValue([
      { id: '1', name: 'Game 1', time: 100 },
      { id: '2', name: 'Game 2', time: 200 }
    ]);

    await timersCommand.execute(mockInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Game 1')
    );
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Game 2')
    );
  });

  it('should include active timer time in total playtime', async () => {
    getActivities.mockResolvedValue([
      { id: '1', name: 'Game 1', time: 100 }
    ]);
    findTimer.mockReturnValue({ id: '1', time: 1234567890 });
    calculateTime.mockReturnValue(50);

    await timersCommand.execute(mockInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Game 1')
    );
    expect(calculateTime).toHaveBeenCalledWith({ id: '1', time: 1234567890 });
  });

  it('should handle generic errors gracefully', async () => {
    getActivities.mockRejectedValue(new Error('Database error'));

    await timersCommand.execute(mockInteraction);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'There was an error while fetching your games.'
    );
  });
}); 