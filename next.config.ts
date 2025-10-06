import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // For development: allow access from any IP address on the local network
    experimental: {
        allowedDevOrigins: ['*'], // Allow all origins in development
    },
    
    async headers() {
        return [
            {
                // Áp dụng cho tất cả các route
                source: "/(.*)",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" }, // hoặc thay * bằng domain cụ thể
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
