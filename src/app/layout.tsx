import type { Metadata } from "next";
import QueryProvider from "@/components/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Cockpit — Local-First",
  description: "Self-hosted, local-first personal finance & portfolio cockpit."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
