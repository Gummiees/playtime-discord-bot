// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  applicationDefault: jest.fn()
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn()
      }))
    }))
  }))
}));

// Mock Google Cloud Logging
jest.mock('@google-cloud/logging', () => {
  const mockLog = jest.fn(() => ({
    entry: jest.fn().mockReturnValue('mock-entry'),
    write: jest.fn().mockResolvedValue()
  }));

  return {
    Logging: jest.fn().mockImplementation(() => ({
      log: mockLog
    }))
  };
});

// Mock moment
jest.mock('moment', () => {
  const moment = jest.requireActual('moment');
  moment.fn.format = jest.fn().mockReturnValue('1234567890');
  return moment;
});

// Mock Discord.js
jest.mock('discord.js', () => {
  const actual = jest.requireActual('discord.js');
  return {
    ...actual,
    Client: jest.fn().mockImplementation(() => ({
      commands: new Map(),
      cooldowns: new Map(),
      on: jest.fn()
    })),
    Collection: jest.fn().mockImplementation(() => new Map()),
    Events: {
      ...actual.Events,
      InteractionCreate: 'interactionCreate'
    },
    GatewayIntentBits: {
      ...actual.GatewayIntentBits,
      Guilds: 1,
      GuildMessages: 2,
      MessageContent: 4,
      GuildMembers: 8,
      GuildPresences: 16
    },
    SlashCommandBuilder: jest.fn().mockImplementation(() => ({
      setName: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      addStringOption: jest.fn().mockReturnThis(),
      addBooleanOption: jest.fn().mockReturnThis(),
      toJSON: jest.fn()
    }))
  };
}); 