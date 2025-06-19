// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://1180ce6c82892b79c524935506bb8a27@o4509512263270400.ingest.de.sentry.io/4509512266022992",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: true,

  _experiments: { enableLogs: true },

  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] })
  ],
});
