// Adds Firebase (FCM) to Android builds when its config is available — Android can't get a
// push token without it. EAS builds read the file from the GOOGLE_SERVICES_JSON file
// variable (eas env:create … --type file); local builds read ./google-services.json.
const fs = require("fs");

module.exports = ({ config }) => {
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ??
    (fs.existsSync("./google-services.json") ? "./google-services.json" : undefined);

  if (!googleServicesFile) {
    console.warn("[app.config] No google-services.json — this build will not receive push notifications on Android.");
  }

  return {
    ...config,
    android: { ...config.android, ...(googleServicesFile ? { googleServicesFile } : {}) },
  };
};
