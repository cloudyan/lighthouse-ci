
// https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md

module.exports = {
  ci: {
    collect: {
      // collect options here
      url: ['https://www.baidu.com/'],
      numberOfRuns: 5,
      // startServerCommand: 'rails server -e production',
    },
    assert: {
      // assert options here
      assertions: {
        'categories:performance': ['warn', {minScore: 1}],
        'categories:accessibility': ['error', {minScore: 1}]
      }
    },
    upload: {
      // upload options here
      target: 'temporary-public-storage',
    },
    server: {
      // server options here
    },
    wizard: {
      // wizard options here
    },
  },
};
