const { storeActivity } = require('../../../database/storeActivity');
const { logError } = require('../../../logger');
const trackActivityCommand = require('../../../commands/utility/track-activity');

jest.mock('../../../database/storeActivity');
jest.mock('../../../logger');

describe('Track Activity Command', () => {
    let mockInteraction;

    beforeEach(() => {
        mockInteraction = {
            user: { id: '123' },
            member: {
                presence: {
                    activities: []
                }
            },
            deferReply: jest.fn(),
            editReply: jest.fn()
        };

        storeActivity.mockReset();
        logError.mockReset();
    });

    it('should handle no activities present', async () => {
        await trackActivityCommand.execute(mockInteraction);

        expect(mockInteraction.deferReply).toHaveBeenCalled();
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            'You don\'t have any active activities to track. Start an activity first!'
        );
        expect(storeActivity).not.toHaveBeenCalled();
    });

    it('should handle only game activities present', async () => {
        mockInteraction.member.presence.activities = [
            { type: 0, name: 'Game1', applicationId: '123' }
        ];

        await trackActivityCommand.execute(mockInteraction);

        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            'You don\'t have any non-game activities to track. Note that games are tracked automatically!'
        );
        expect(storeActivity).not.toHaveBeenCalled();
    });

    it('should track first non-game activity with applicationId', async () => {
        const mockActivity = {
            type: 2, // Listening activity
            name: 'Spotify',
            applicationId: 'spotify123'
        };
        mockInteraction.member.presence.activities = [
            { type: 0, name: 'Game1' },
            mockActivity,
            { type: 3, name: 'Another Activity' }
        ];

        await trackActivityCommand.execute(mockInteraction);

        expect(storeActivity).toHaveBeenCalledWith('123', {
            id: 'spotify123',
            name: 'Spotify',
            time: 0,
            type: 2
        });
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            'Started tracking activity: **Spotify**. Your time spent on this activity will now be recorded.'
        );
    });

    it('should track first non-game activity without applicationId', async () => {
        const mockActivity = {
            type: 4, // Custom activity
            name: 'Custom Status'
        };
        mockInteraction.member.presence.activities = [
            mockActivity
        ];

        await trackActivityCommand.execute(mockInteraction);

        expect(storeActivity).toHaveBeenCalledWith('123', {
            id: 'Custom Status',
            name: 'Custom Status',
            time: 0,
            type: 4
        });
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            'Started tracking activity: **Custom Status**. Your time spent on this activity will now be recorded.'
        );
    });

    it('should handle errors gracefully', async () => {
        mockInteraction.member.presence.activities = [
            { type: 2, name: 'Spotify' }
        ];
        const error = new Error('Database error');
        storeActivity.mockRejectedValue(error);

        await trackActivityCommand.execute(mockInteraction);

        expect(logError).toHaveBeenCalledWith(
            'Error in track-activity command for user 123: Database error'
        );
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            'There was an error while trying to track your activity.'
        );
    });
}); 