const configuredHost = process.env.NEXT_PUBLIC_SITE_URL
  ?? process.env.VERCEL_PROJECT_PRODUCTION_URL
  ?? process.env.VERCEL_URL
  ?? "streamforge-live-studio.vercel.app";

export const siteUrl = new URL(configuredHost.startsWith("http") ? configuredHost : `https://${configuredHost}`);
