module.exports = ({ config }) => {
  const development = process.env.EAS_BUILD_PROFILE === 'development';
  return {
    ...config,
    updates: development
      ? { enabled: false }
      : {
          url: config.updates.url,
          checkAutomatically: 'ON_ERROR_RECOVERY',
          fallbackToCacheTimeout: 0,
        },
  };
};
