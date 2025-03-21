const { Collection } = require('discord.js');
const interactionCreate = require('../../events/interactionCreate');

describe('Interaction Create Event', () => {
  let mockInteraction;
  let mockCommand;
  let mockClient;

  beforeEach(() => {
    // Mock console methods
    console.error = jest.fn();
    console.log = jest.fn();

    // Mock setTimeout
    jest.useFakeTimers();

    // Create mock command
    mockCommand = {
      data: { name: 'test' },
      cooldown: 5,
      execute: jest.fn()
    };

    // Create mock client
    mockClient = {
      commands: new Map([['test', mockCommand]]),
      cooldowns: new Map()
    };

    // Create mock interaction
    mockInteraction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      commandName: 'test',
      user: { id: '123' },
      client: mockClient,
      reply: jest.fn(),
      followUp: jest.fn(),
      deferred: false,
      replied: false
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should ignore non-chat input commands', async () => {
    mockInteraction.isChatInputCommand.mockReturnValue(false);
    await interactionCreate.execute(mockInteraction);
    expect(mockCommand.execute).not.toHaveBeenCalled();
  });

  it('should handle unknown commands', async () => {
    mockClient.commands.delete('test');
    await interactionCreate.execute(mockInteraction);
    expect(console.error).toHaveBeenCalledWith('No command matching test was found.');
    expect(mockCommand.execute).not.toHaveBeenCalled();
  });

  it('should execute command successfully', async () => {
    await interactionCreate.execute(mockInteraction);
    expect(mockCommand.execute).toHaveBeenCalledWith(mockInteraction);
    expect(mockClient.cooldowns.get('test')).toBeDefined();
    expect(mockClient.cooldowns.get('test').has('123')).toBe(true);
  });

  it('should handle command cooldown', async () => {
    const now = Date.now();
    const timestamps = new Collection();
    timestamps.set('123', now);
    mockClient.cooldowns.set('test', timestamps);

    await interactionCreate.execute(mockInteraction);
    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('cooldown'),
      ephemeral: true
    });
    expect(mockCommand.execute).not.toHaveBeenCalled();
  });

  it('should use default cooldown when not specified', async () => {
    delete mockCommand.cooldown;
    await interactionCreate.execute(mockInteraction);
    expect(mockCommand.execute).toHaveBeenCalled();
  });

  it('should handle command execution errors', async () => {
    mockCommand.execute.mockRejectedValue(new Error('Command failed'));
    await interactionCreate.execute(mockInteraction);
    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: 'There was an error while executing this command!',
      ephemeral: true
    });
  });

  it('should use followUp for errors when interaction is already replied', async () => {
    mockCommand.execute.mockRejectedValue(new Error('Command failed'));
    mockInteraction.deferred = true;
    await interactionCreate.execute(mockInteraction);
    expect(mockInteraction.followUp).toHaveBeenCalledWith({
      content: 'There was an error while executing this command!',
      ephemeral: true
    });
  });

  it('should clear cooldown after timeout', async () => {
    await interactionCreate.execute(mockInteraction);
    expect(mockClient.cooldowns.get('test').has('123')).toBe(true);
    
    // Fast-forward the timeout
    jest.advanceTimersByTime(5000); // 5 seconds (cooldown)
    
    expect(mockClient.cooldowns.get('test').has('123')).toBe(false);
  });
}); 