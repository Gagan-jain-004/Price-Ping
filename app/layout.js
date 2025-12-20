import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata = {
  title: "Price Tracker - Never Miss a Price Drop",
  description:
    "Track product prices across e-commerce sites and get alerts on price drops",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}

        <Toaster richColors />

          <footer className="bg-muted/50 py-12">
              <div className="container mx-auto px-4 text-center text-Orange">
                <p>© {new Date().getFullYear()} Gagan Jain. All rights reservered.</p>
              </div>
            </footer>
      </body>
    </html>
  );
}
