import { redirect } from "next/navigation";

/**
 * Landing page — redirects to /reglas as the default view.
 */
export default function Home() {
	redirect("/reglas");
}
