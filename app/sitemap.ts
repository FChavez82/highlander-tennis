import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/**
 * Generates sitemap.xml with all public routes.
 * Dynamic player profile URLs could be added here if SEO for individual players is needed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();

	return [
		{
			url: SITE_URL,
			lastModified: now,
			changeFrequency: "daily",
			priority: 1,
		},
		{
			url: `${SITE_URL}/clasificacion`,
			lastModified: now,
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: `${SITE_URL}/resultados`,
			lastModified: now,
			changeFrequency: "daily",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/calendario`,
			lastModified: now,
			changeFrequency: "daily",
			priority: 0.7,
		},
		{
			url: `${SITE_URL}/jugadores`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: `${SITE_URL}/reglas`,
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.5,
		},
	];
}
