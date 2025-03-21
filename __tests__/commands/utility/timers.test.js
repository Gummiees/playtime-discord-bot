const { getActivities } = require('../../../database/getActivities');
const { findTimer } = require('../../../timers');
const { calculateTime } = require('../../../utils');
const { NoUserError } = require('../../../database/exceptions/noUserError');
const timersCommand = require('../../../commands/utility/timers');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

jest.mock('../../../database/getActivities');
jest.mock('../../../timers');
jest.mock('../../../utils');

describe('Timers Command', () => {
  let mockInteraction;
  let mockReply;
  let mockCollector;

  beforeEach(() => {
    mockCollector = {
      on: jest.fn()
    };

    mockReply = {
      createMessageComponentCollector: jest.fn().mockReturnValue(mockCollector)
    };

    mockInteraction = {
      user: { id: '123', username: 'TestUser' },
      deferReply: jest.fn(),
      editReply: jest.fn().mockResolvedValue(mockReply)
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

  it('should display first page of games with pagination when there are more than 10 games', async () => {
    const games = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Game ${i + 1}`,
      time: (i + 1) * 100
    }));
    getActivities.mockResolvedValue(games);

    await timersCommand.execute(mockInteraction);

    const reply = mockInteraction.editReply.mock.calls[0][0];
    expect(reply.content).toContain('🎮 **TestUser\'s Gaming Stats**');
    expect(reply.content).toContain('📊 Total Games: **15**');
    expect(reply.content).toContain('Showing games 1-10 of 15');
    expect(reply.content).toContain('🥇 **Game 15**');  // Most played game
    expect(reply.content).toContain('🥈 **Game 14**');  // Second most played
    expect(reply.content).toContain('🥉 **Game 13**');  // Third most played
    expect(reply.components).toHaveLength(1);
    expect(reply.components[0]).toBeInstanceOf(ActionRowBuilder);
  });

  it('should not show pagination buttons when there are 10 or fewer games', async () => {
    const games = Array.from({ length: 5 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Game ${i + 1}`,
      time: (i + 1) * 100
    }));
    getActivities.mockResolvedValue(games);

    await timersCommand.execute(mockInteraction);

    const reply = mockInteraction.editReply.mock.calls[0][0];
    expect(reply.content).toContain('🎮 **TestUser\'s Gaming Stats**');
    expect(reply.content).toContain('📊 Total Games: **5**');
    expect(reply.content).not.toContain('Showing games');
    expect(reply.content).toContain('🥇 **Game 5**');  // Most played game
    expect(reply.components).toHaveLength(0);
  });

  it('should sort games by playtime in descending order', async () => {
    const games = [
      { id: '1', name: 'Game 1', time: 100 },
      { id: '2', name: 'Game 2', time: 300 },
      { id: '3', name: 'Game 3', time: 200 }
    ];
    getActivities.mockResolvedValue(games);

    await timersCommand.execute(mockInteraction);

    const reply = mockInteraction.editReply.mock.calls[0][0];
    const lines = reply.content.split('\n');
    expect(lines.find(line => line.includes('Game 2'))).toContain('🥇');
    expect(lines.find(line => line.includes('Game 3'))).toContain('🥈');
    expect(lines.find(line => line.includes('Game 1'))).toContain('🥉');
  });

  it('should include active timer time in total playtime', async () => {
    getActivities.mockResolvedValue([
      { id: '1', name: 'Game 1', time: 100 }
    ]);
    findTimer.mockReturnValue({ id: '1', time: 1234567890 });
    calculateTime.mockReturnValue(50);

    await timersCommand.execute(mockInteraction);

    const reply = mockInteraction.editReply.mock.calls[0][0];
    expect(reply.content).toContain('🥇 **Game 1**');
    expect(calculateTime).toHaveBeenCalledWith({ id: '1', time: 1234567890 });
  });

  it('should handle generic errors gracefully', async () => {
    getActivities.mockRejectedValue(new Error('Database error'));

    await timersCommand.execute(mockInteraction);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'There was an error while fetching your games.'
    );
  });

  describe('Pagination Components', () => {
    it('should return null when there is only one page', () => {
      const components = timersCommand.getPageComponents(0, 1);
      expect(components).toBeNull();
    });

    it('should only show next button on first page when there are multiple pages', () => {
      const components = timersCommand.getPageComponents(0, 3);
      expect(components.components).toHaveLength(1);
      expect(components.components[0].data.custom_id).toBe('next');
      expect(components.components[0].data.label).toBe('Next ▶️');
    });

    it('should only show previous button on last page', () => {
      const components = timersCommand.getPageComponents(2, 3);
      expect(components.components).toHaveLength(1);
      expect(components.components[0].data.custom_id).toBe('prev');
      expect(components.components[0].data.label).toBe('◀️ Previous');
    });

    it('should show both buttons on middle pages', () => {
      const components = timersCommand.getPageComponents(1, 3);
      expect(components.components).toHaveLength(2);
      expect(components.components[0].data.custom_id).toBe('prev');
      expect(components.components[0].data.label).toBe('◀️ Previous');
      expect(components.components[1].data.custom_id).toBe('next');
      expect(components.components[1].data.label).toBe('Next ▶️');
    });
  });
}); 