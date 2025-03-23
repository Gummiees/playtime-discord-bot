const { getFirestore } = require('firebase-admin/firestore');
const { storeActivity } = require('../../database/storeActivity');
const { calculateTime } = require('../../utils');

jest.mock('firebase-admin/firestore');
jest.mock('../../utils');

describe('storeActivity', () => {
    let mockDb;
    let mockUserRef;
    let mockGameRef;
    let mockUserDoc;
    let mockGameDoc;

    beforeEach(() => {
        mockGameDoc = {
            exists: false,
            data: jest.fn()
        };
        mockUserDoc = {
            exists: false
        };
        mockGameRef = {
            get: jest.fn().mockResolvedValue(mockGameDoc),
            set: jest.fn().mockResolvedValue()
        };
        mockUserRef = {
            get: jest.fn().mockResolvedValue(mockUserDoc),
            set: jest.fn().mockResolvedValue(),
            collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue(mockGameRef)
            })
        };
        mockDb = {
            collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue(mockUserRef)
            })
        };

        getFirestore.mockReturnValue(mockDb);
        calculateTime.mockReturnValue(100);
    });

    it('should create new user and store game activity', async () => {
        const timer = {
            userId: 'user123',
            id: 'game456',
            name: 'Test Game',
            time: 1234567890
        };

        await storeActivity(timer);

        expect(mockUserRef.set).toHaveBeenCalledWith({ id: 'user123' });
        expect(mockGameRef.set).toHaveBeenCalledWith({
            id: 'game456',
            name: 'Test Game',
            time: 100,
            type: 0
        });
    });

    it('should update existing game activity', async () => {
        mockUserDoc.exists = true;
        mockGameDoc.exists = true;
        mockGameDoc.data.mockReturnValue({
            time: 50,
            type: 0
        });

        const timer = {
            userId: 'user123',
            id: 'game456',
            name: 'Test Game',
            time: 1234567890
        };

        await storeActivity(timer);

        expect(mockUserRef.set).not.toHaveBeenCalled();
        expect(mockGameRef.set).toHaveBeenCalledWith({
            id: 'game456',
            name: 'Test Game',
            time: 150, // Previous 50 + new 100
            type: 0
        });
    });

    it('should store non-game activity with type', async () => {
        const timer = {
            userId: 'user123',
            id: 'spotify456',
            name: 'Spotify',
            time: 1234567890,
            type: 2
        };

        await storeActivity(timer);

        expect(mockUserRef.set).toHaveBeenCalledWith({ id: 'user123' });
        expect(mockGameRef.set).toHaveBeenCalledWith({
            id: 'spotify456',
            name: 'Spotify',
            time: 100,
            type: 2
        });
    });

    it('should preserve existing activity type when updating', async () => {
        mockUserDoc.exists = true;
        mockGameDoc.exists = true;
        mockGameDoc.data.mockReturnValue({
            time: 50,
            type: 2
        });

        const timer = {
            userId: 'user123',
            id: 'spotify456',
            name: 'Spotify',
            time: 1234567890,
            type: 2
        };

        await storeActivity(timer);

        expect(mockUserRef.set).not.toHaveBeenCalled();
        expect(mockGameRef.set).toHaveBeenCalledWith({
            id: 'spotify456',
            name: 'Spotify',
            time: 150,
            type: 2
        });
    });
}); 