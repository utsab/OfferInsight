module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // Adjust this based on your path aliases
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Optional: for additional setup
};
