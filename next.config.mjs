import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@coinbase/onchainkit', 'wagmi', 'viem', '@rainbow-me/rainbowkit'],
    webpack: (config) => {
        config.externals.push("pino-pretty", "lokijs", "encoding");
        config.resolve.alias = {
            ...config.resolve.alias,
            "@react-native-async-storage/async-storage": false,
        };
        return config;
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
};

export default nextConfig;
