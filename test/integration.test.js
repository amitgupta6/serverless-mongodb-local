const fetch = require('node-fetch');
const { node } = require('execa');
const { resolve } = require('path');

let serverlessProcess;

const serverlessPath = resolve(
  __dirname,
  '../node_modules/serverless/bin/serverless'
);

const startNodeProcess = (yamlFile, stage) => {
  const stageOpt = stage ? ['--stage', stage] : [];
  return async () => {
    serverlessProcess = node(serverlessPath, ['offline', 'start', ...stageOpt, '--config', yamlFile,
      '--noPrependStageInUrl', '--httpPort', '8765', '--lambdaPort', '8432'], {
      cwd: './'
    });

    await new Promise((res) => {
      serverlessProcess.stdout.on('data', (data) => {
        if (String(data).includes('[HTTP] server ready')) {
          res();
        }
      });
    });
  };
};

const testRequest = (success) => {
  return async () => {
      const response = await fetch('http://localhost:8765');
      expect(response.ok).toEqual(success);

      if (!success) return;

      const result = await response.json();
      expect(result.length).toEqual(3);
    };
};


describe('MongoDB Integration Tests', () => {

  describe('With plain stage match', () => {
    beforeAll(startNodeProcess('./example/serverless.yaml'), 30000);

    test('Starts and seeds a MongoDB instance', testRequest(true), 30000);

    afterAll(async () => {
      await serverlessProcess.cancel();
    });
  });

  describe('Without plain stage match', () => {
    beforeAll(startNodeProcess('./example/serverless.yaml', 'test'), 30000);

    test('Does not start a MongoDB instance', testRequest(false), 30000);

    afterAll(async () => {
      await serverlessProcess.cancel();
    });
  });

  describe('With regex stage match', () => {
    beforeAll(startNodeProcess('./example/serverless-regex.yaml'), 30000);

    test('Starts and seeds a MongoDB instance', testRequest(true), 30000);

    afterAll(async () => {
      await serverlessProcess.cancel();
    });
  });

  describe('Without regex stage match', () => {
    beforeAll(startNodeProcess('./example/serverless-regex.yaml', 'test'), 30000);

    test('Does not start a MongoDB instance', testRequest(false), 30000);

    afterAll(async () => {
      await serverlessProcess.cancel();
    });
  });
});
