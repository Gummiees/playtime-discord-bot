const { Timer } = require('../../models/timer');

describe('Timer', () => {
  it('should create a timer with the correct properties', () => {
    const userId = '123';
    const id = '456';
    const name = 'Test Game';
    const time = '1234567890';

    const timer = new Timer(userId, id, name, time);

    expect(timer.userId).toBe(userId);
    expect(timer.id).toBe(id);
    expect(timer.name).toBe(name);
    expect(timer.time).toBe(time);
  });
}); 