import "./globals.css";

export const metadata = {
  title: "Moon Star POS",
  description: "Moon Star POS store and user administration"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
