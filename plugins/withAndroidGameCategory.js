// Marks the app as a game so Android 16+ keeps our portrait lock on large screens.
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withAndroidGameCategory(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      app.$ = { ...app.$, 'android:appCategory': 'game' };
    }
    return cfg;
  });
};
