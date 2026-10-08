/** @type {import('next').NextConfig} */

// Remote image hosts allowed for next/image.
// Product images are plain URLs stored by the backend (ProductImage.imageUrl);
// the demo catalogue uses Unsplash. The backend origin is added too, so any
// future backend-hosted asset works without a config change.
const remotePatterns = [
  { protocol: "https", hostname: "images.unsplash.com" },
];

if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
    remotePatterns.push({
      protocol: apiUrl.protocol.replace(":", ""),
      hostname: apiUrl.hostname,
      ...(apiUrl.port ? { port: apiUrl.port } : {}),
    });
  } catch {
    // Invalid URL — fall through; api.js reports the configuration error.
  }
}

const nextConfig = {
  reactCompiler: true,
  images: { remotePatterns },
};

export default nextConfig;
