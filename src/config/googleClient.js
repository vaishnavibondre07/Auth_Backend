import { OAuth2Client } from "google-auth-library";

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID in environment variables");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET in environment variables");
}

if (!process.env.GOOGLE_REFRESH_TOKEN) {
  throw new Error("Missing GOOGLE_REFRESH_TOKEN in environment variables");
}

if (!process.env.GOOGLE_USER) {
  throw new Error("Missing GOOGLE_USER in environment variables");
}

export const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REFRESH_TOKEN
);

// import { OAuth2Client } from "google-auth-library";

// if (!process.env.GOOGLE_CLIENT_ID) {
//   throw new Error("Missing GOOGLE_CLIENT_ID in environment variables");
// }

// if (!process.env.GOOGLE_CLIENT_SECRET) {
//   throw new Error("Missing GOOGLE_CLIENT_SECRET in environment variables");
// }

// if (!process.env.GOOGLE_REFRESH_TOKEN) {
//   throw new Error("Missing GOOGLE_REFRESH_TOKEN in environment variables");
// }

// if (!process.env.GOOGLE_USER) {
//   throw new Error("Missing GOOGLE_USER in environment variables");
// }

// export const googleClient = new OAuth2Client(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   process.env.GOOGLE_REFRESH_TOKEN
// );