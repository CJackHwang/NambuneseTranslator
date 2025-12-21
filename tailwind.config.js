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
                sans: [
                    '"Share Tech Mono"', // Primary Industrial Font
                    '"VT323"',
                    '"Noto Sans TC"',
                    '"Noto Sans JP"',
                    'ui-sans-serif',
                    'system-ui',
                    'sans-serif',
                ],
                serif: ['"Noto Serif SC"', '"Songti SC"', 'serif'],
                mono: ['"VT323"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
            },
            colors: {
                dl: {
                    bg: '#0D0E15',      // Deep dark screen background
                    chassis: '#E8E4D9', // Industrial Beige (Device Body)
                    plate: '#D4CDC0',   // Darker Plate/Bezel
                    surface: '#1A1C23', // Panel/Component background
                    output: '#12141C',  // Darker output recess
                    border: '#2A2F3E',  // Industrial border
                    text: '#E0E0E0',    // Standard text (off-white)
                    textSec: '#8592A6', // Secondary text (faded markings)
                    primary: '#FFB000', // Amber Phosphor (Primary Action/Highlight)
                    accent: '#00F0FF',  // VFD Cyan (Accents/Scanning lines)
                    hover: '#232630',   // Hover state

                    // CRT/Industrial specifics (Optional usage in custom classes)
                    crt: {
                        green: '#33FF00',
                        amber: '#FFB000',
                        grid: '#1F2937'
                    },

                    // Keeping dark mode structure for compatibility if needed, 
                    // though this theme is inherently dark.
                    dark: {
                        bg: '#050505',
                        surface: '#0A0A0A',
                        output: '#000000',
                        border: '#333333',
                        text: '#33FF00', // Green Phosphor in "pure" dark mode
                        textSec: '#008F11',
                        hover: '#111111',
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
