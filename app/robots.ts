import type { MetadataRoute } from "next";

/**
 * Generates robots.txt — allows all crawlers on all public pages.
 * Admin routes are excluded via disallow.
 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/admin", "/api"],
		},
	};
}
