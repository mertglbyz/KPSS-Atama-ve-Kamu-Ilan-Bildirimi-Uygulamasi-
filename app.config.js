const app = require('./app.json');

module.exports = () => {
  const expo = app.expo;
  const development = process.env.EAS_BUILD_PROFILE === 'development';
  return {
    expo: {
      ...expo,
      updates: development
        ? { enabled: false }
        : {
            url: expo.updates.url,
            checkAutomatically: 'ON_ERROR_RECOVERY',
            fallbackToCacheTimeout: 0,
          },
    },
  };
};
