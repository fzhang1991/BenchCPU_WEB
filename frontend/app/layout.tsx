import "./globals.css";
import Navbar from "../components/Navbar";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Navbar />
          <main className="page">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
