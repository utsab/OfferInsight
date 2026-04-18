/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // Adjust this based on your path aliases
    '^auth$': '<rootDir>/auth.ts', // Resolve bare 'auth' specifier used in route handlers
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Optional: for additional setup
  transformIgnorePatterns: [
    '/node_modules/(?!(next)/)', // Allow ts-jest to transform next/* internals
  ],
};
