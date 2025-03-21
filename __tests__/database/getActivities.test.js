const { getFirestore } = require('firebase-admin/firestore');
const { getActivities } = require('../../database/getActivities');
const { NoUserError } = require('../../database/exceptions/noUserError');

jest.mock('firebase-admin/firestore');

describe('getActivities', () => {
  let mockUserDoc;
  let mockUserRef;
  let mockGamesCollection;
  let mockGamesSnapshot;

  beforeEach(() => {
    mockUserDoc = {
      exists: true
    };

    mockUserRef = {
      get: jest.fn().mockResolvedValue(mockUserDoc)
    };

    mockGamesSnapshot = {
      docs: [
        { data: () => ({ id: '1', name: 'Game 1', time: 100 }) },
        { data: () => ({ id: '2', name: 'Game 2', time: 200 }) }
      ]
    };

    mockGamesCollection = {
      get: jest.fn().mockResolvedValue(mockGamesSnapshot)
    };

    getFirestore.mockReturnValue({
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue(mockUserRef)
      })
    });

    mockUserRef.collection = jest.fn().mockReturnValue(mockGamesCollection);
  });

  it('should throw NoUserError when user does not exist', async () => {
    mockUserDoc.exists = false;

    await expect(getActivities('123')).rejects.toThrow(NoUserError);
  });

  it('should return empty array when user has no games', async () => {
    mockGamesSnapshot.docs = [];

    const result = await getActivities('123');
    expect(result).toEqual([]);
  });

  it('should return array of games when user has games', async () => {
    const result = await getActivities('123');
    expect(result).toEqual([
      { id: '1', name: 'Game 1', time: 100 },
      { id: '2', name: 'Game 2', time: 200 }
    ]);
  });
}); 