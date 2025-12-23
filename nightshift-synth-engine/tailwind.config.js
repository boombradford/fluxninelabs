/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neon: {
                    pink: '#ff00ff',
                    cyan: '#00ffff',
                    purple: '#bd00ff',
                },
                dark: {
                    bg: '#0a0a12',
                    panel: '#11111f',
                }
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
