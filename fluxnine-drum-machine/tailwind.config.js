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
                    blue: '#00f3ff',
                    pink: '#ff00ff',
                    green: '#00ff00',
                },
                dark: {
                    bg: '#0a0a0a',
                    surface: '#1a1a1a',
                    highlight: '#2a2a2a'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
