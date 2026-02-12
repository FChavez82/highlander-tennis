import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				/* Colores del torneo — verde cancha + dorado */
				court: {
					50: "#f0fdf4",
					100: "#dcfce7",
					500: "#22c55e",
					600: "#16a34a",
					700: "#15803d",
					800: "#166534",
					900: "#14532d",
				},
				gold: {
					400: "#facc15",
					500: "#eab308",
					600: "#ca8a04",
				},
			},
		},
	},
	plugins: [],
};
export default config;
