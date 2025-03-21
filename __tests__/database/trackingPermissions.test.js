const { getFirestore } = require('firebase-admin/firestore');
const { getTrackingPermissions, setTrackingPermissions } = require('../../database/trackingPermissions');

jest.mock('firebase-admin/firestore');

describe('Tracking Permissions', () => {
  let mockDoc;
  let mockRef;
  let mockCollection;

  beforeEach(() => {
    mockDoc = {
      exists: true,
      data: jest.fn()
    };

    mockRef = {
      get: jest.fn().mockResolvedValue(mockDoc),
      set: jest.fn().mockResolvedValue(),
      update: jest.fn().mockResolvedValue()
    };

    mockCollection = {
      doc: jest.fn().mockReturnValue(mockRef)
    };

    getFirestore.mockReturnValue({
      collection: jest.fn().mockReturnValue(mockCollection)
    });
  });

  describe('getTrackingPermissions', () => {
    it('should return false when user document does not exist', async () => {
      mockDoc.exists = false;
      const result = await getTrackingPermissions('123');
      expect(result).toBe(false);
    });

    it('should return false when trackingEnabled is not set', async () => {
      mockDoc.data.mockReturnValue({});
      const result = await getTrackingPermissions('123');
      expect(result).toBe(false);
    });

    it('should return the tracking status when set', async () => {
      mockDoc.data.mockReturnValue({ trackingEnabled: true });
      const result = await getTrackingPermissions('123');
      expect(result).toBe(true);
    });
  });

  describe('setTrackingPermissions', () => {
    it('should create new document when user does not exist', async () => {
      mockDoc.exists = false;
      await setTrackingPermissions('123', true);
      expect(mockRef.set).toHaveBeenCalledWith({
        id: '123',
        trackingEnabled: true
      });
    });

    it('should update existing document when user exists', async () => {
      await setTrackingPermissions('123', true);
      expect(mockRef.update).toHaveBeenCalledWith({
        trackingEnabled: true
      });
    });
  });
}); 