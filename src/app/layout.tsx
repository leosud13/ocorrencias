import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getSchoolDescription, getSchoolPageTitle } from "@/lib/school-config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: getSchoolPageTitle(),
  description: getSchoolDescription(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
