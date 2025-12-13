/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Roboto"', '"Noto Sans TC"', '"Noto Sans JP"', 'sans-serif'],
                jp: ['"Noto Sans JP"', 'sans-serif'],
            },
            colors: {
                dl: {
                    bg: '#F3F5F7',
                    surface: '#FFFFFF',
                    output: '#F7F8FA',
                    border: '#E3E5E8',
                    text: '#0F2B46',
                    textSec: '#64748B',
                    primary: '#0F2B46',
                    accent: '#006A6A', // The original Teal for highlights
                    hover: '#F1F3F6',

                    // Dark Mode Colors
                    dark: {
                        bg: '#0f172a',
                        surface: '#1e293b',
                        output: '#1e293b',
                        border: '#334155',
                        text: '#f1f5f9',
                        textSec: '#94a3b8',
                        hover: '#334155',
                    }
                }
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                'float': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
            }
        },
    },
    plugins: [],
}
