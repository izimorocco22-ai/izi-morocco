import { MEDIA_URL } from "../../../utils/config";

// Helper to extract filename if MEDIA_URL prefixed
export const extractFilename = (url) => {
  if (typeof url !== "string") return url;
  if (!url.includes("/")) return url;

  // Handle Cloudinary URLs - keep full URL
  if (url.includes("cloudinary.com")) {
    return url;
  }

  // Handle MEDIA_URL prefixed paths
  if (url.includes(MEDIA_URL()) || url.includes(MEDIA_URL("video"))) {
    return url
      .replace(MEDIA_URL(), "")
      .replace(MEDIA_URL("video"), "")
      .replace(/^\//, "");
  }

  return url;
};
