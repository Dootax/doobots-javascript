/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",

  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: false
          },
          target: "es2022"
        },
        module: {
          type: "es6"
        }
      }
    ]
  },

  extensionsToTreatAsEsm: [".ts"],

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};