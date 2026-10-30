import './globals.css';
import React from 'react';

export const metadata = {
  title: 'ApexSEO - Enterprise AI SEO Platform & Audit Engine',
  description: 'Production-grade AI SEO platform with 25 audit sub-skills, humanizer studio, white-label reporting, and Google API integrations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
