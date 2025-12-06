// This file is intentionally blank after refactoring to route groups.
// The root layouts are now in /app/(main)/layout.tsx and /app/(auth)/layout.tsx.
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
