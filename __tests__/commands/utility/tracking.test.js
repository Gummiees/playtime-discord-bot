const { setTrackingPermissions, getTrackingPermissions } = require('../../../database/trackingPermissions');
const trackingCommand = require('../../../commands/utility/tracking');

jest.mock('../../../database/trackingPermissions');

describe('Tracking Command', () => {
  let mockInteraction;

  beforeEach(() => {
    mockInteraction = {
      user: { id: '123' },
      options: {
        getBoolean: jest.fn()
      },
      deferReply: jest.fn(),
      editReply: jest.fn()
    };

    setTrackingPermissions.mockResolvedValue();
    getTrackingPermissions.mockResolvedValue(false);
  });

  it('should enable tracking when requested', async () => {
    mockInteraction.options.getBoolean.mockReturnValue(true);
    getTrackingPermissions.mockResolvedValue(true);

    await trackingCommand.execute(mockInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(setTrackingPermissions).toHaveBeenCalledWith('123', true);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'Game time tracking has been enabled for your account. Your game time will now be tracked.'
    );
  });

  it('should disable tracking when requested', async () => {
    mockInteraction.options.getBoolean.mockReturnValue(false);
    getTrackingPermissions.mockResolvedValue(false);

    await trackingCommand.execute(mockInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(setTrackingPermissions).toHaveBeenCalledWith('123', false);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'Game time tracking has been disabled for your account. Your game time will no longer be tracked.'
    );
  });

  it('should handle errors gracefully', async () => {
    mockInteraction.options.getBoolean.mockReturnValue(true);
    setTrackingPermissions.mockRejectedValue(new Error('Database error'));

    await trackingCommand.execute(mockInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'There was an error while updating your tracking preferences.'
    );
  });
}); 