import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.externals.push("pino-pretty", "lokijs", "encoding");

        // FORCE RESOLUTION OF REACT TO AVOID DUPLICATES
        config.resolve.alias = {
            ...config.resolve.alias,
            react: path.resolve(__dirname, "node_modules/react"),
            "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
            "@tanstack/react-query": path.resolve(__dirname, "node_modules/@tanstack/react-query"),
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
