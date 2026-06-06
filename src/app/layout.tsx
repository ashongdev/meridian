import type { Metadata } from "next";
import { Fraunces, Inter, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-display-loaded",
	display: "swap",
});

const fraunces = Fraunces({
	subsets: ["latin"],
	variable: "--font-serif-loaded",
	style: ["normal", "italic"],
	axes: ["SOFT", "WONK"],
	display: "swap",
});

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-body-loaded",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Meridian — Study like your life depends on it",
	description:
		"Course communities, verified past exams, and an AI tutor that actually knows your syllabus. Built for African university students.",
	openGraph: {
		title: "Meridian",
		description: "Study like your life depends on it.",
		type: "website",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			className={`${syne.variable} ${fraunces.variable} ${inter.variable} h-full`}
		>
			<style precedence="default" href="root-fonts">{`
        :root {
          --font-display: var(--font-display-loaded), "Syne", system-ui, sans-serif;
          --font-serif:   var(--font-serif-loaded),   "Fraunces", Georgia, serif;
          --font-body:    var(--font-body-loaded),    "Inter", system-ui, sans-serif;
        }
      `}</style>
			<body className="min-h-full flex flex-col bg-paper text-ink antialiased">
				{children}
			</body>
		</html>
	);
}
