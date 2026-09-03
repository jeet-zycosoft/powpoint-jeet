/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 's3.us-east-005.backblazeb2.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'pawpoint.server.zycosoft.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '192.168.0.116',
                port: '8000',
                pathname: '/**',
            },
        ],
        minimumCacheTTL: 14400, // Upgraded default in 16.1 (4 hours) prevents constant image re-validation CPU spikes
    },
    transpilePackages: [],
    experimental: {
        // 2. Optimizes how chunks are streamed down during SSR request loops
        //turbopackChunking: true,
        // 3. Silences noise in your build logs when components bail out
        // of pre-rendering to run dynamically on the server
        hideLogsAfterAbort: true,
    },
    async redirects() {
        return [
            {
                source: '/customer/listing',
                destination: '/sitter/listing',
                permanent: true,
            },
            {
                source: '/worker/listing',
                destination: '/owner/listing',
                permanent: true,
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*', // The URL structure used in your front-end
                // destination: 'http://localhost/api/v1/:path*', // The actual API server
                destination: 'https://pawpoint.server.zycosoft.com/api/v1/:path*', // The actual API server
            },
        ];
    },
    allowedDevOrigins: ['192.168.0.116', '192.168.29.100'],
    reactStrictMode: false,
    turbopack: {
        rules: {
            '*.yaml': {
                loaders: ['yaml-loader'],
                as: '*.js',
            },
        },
    },
    webpack: (config) => {
        config.module.rules.push({
            test: /\.ya?ml$/,
            use: 'yaml-loader',
        });
        return config;
    },
};

export default nextConfig;
