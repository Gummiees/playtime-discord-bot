const { getFirestore } = require('firebase-admin/firestore');
const { storeActivity } = require('../../database/storeActivity');
const { calculateTime } = require('../../utils');

jest.mock('firebase-admin/firestore');
jest.mock('../../utils');

describe('storeActivity', () => {
  let mockUserDoc;
  let mockUserRef;
  let mockGameDoc;
  let mockGameRef;

  beforeEach(() => {
    mockUserDoc = {
      exists: true
    };

    mockUserRef = {
      get: jest.fn().mockResolvedValue(mockUserDoc),
      set: jest.fn().mockResolvedValue(),
      collection: jest.fn()
    };

    mockGameDoc = {
      exists: false,
      data: jest.fn()
    };

    mockGameRef = {
      get: jest.fn().mockResolvedValue(mockGameDoc),
      set: jest.fn().mockResolvedValue()
    };

    getFirestore.mockReturnValue({
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue(mockUserRef)
      })
    });

    mockUserRef.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue(mockGameRef)
    });

    calculateTime.mockReturnValue(100);
  });

  it('should create new user document when user does not exist', async () => {
    mockUserDoc.exists = false;
    const timer = {
      userId: '123',
      id: '456',
      name: 'Test Game',
      time: '1234567890'
    };

    await storeActivity(timer);

    expect(mockUserRef.set).toHaveBeenCalledWith({ id: '123' });
  });

  it('should create new game document when game does not exist', async () => {
    const timer = {
      userId: '123',
      id: '456',
      name: 'Test Game',
      time: '1234567890'
    };

    await storeActivity(timer);

    expect(mockGameRef.set).toHaveBeenCalledWith({
      id: '456',
      name: 'Test Game',
      time: 100
    });
  });

  it('should update existing game document with accumulated time', async () => {
    mockGameDoc.exists = true;
    mockGameDoc.data.mockReturnValue({ time: 50 });

    const timer = {
      userId: '123',
      id: '456',
      name: 'Test Game',
      time: '1234567890'
    };

    await storeActivity(timer);

    expect(mockGameRef.set).toHaveBeenCalledWith({
      id: '456',
      name: 'Test Game',
      time: 150
    });
  });
}); 