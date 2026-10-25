import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { RoleProvider } from '@/context/RoleContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'Hospitality Management OS',
  description: 'Enterprise Front Desk Room Matrix, Walk-In Check-In, Live Guest Folios & Operations Platform',
};

// Runs before paint so the correct theme class is on <html> from the very first frame.
// Defaults cleanly to 'light' (Warm Ivory + Forest Green luxury palette).
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('hotel_theme');var c=document.documentElement.classList;if(t==='dark'){c.add('dark');c.remove('light');}else{c.add('light');c.remove('dark');}}catch(e){document.documentElement.classList.add('light');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased selection:bg-[#0B3D32] selection:text-white bg-[#F8FAFC] text-[#334155]">
        <ThemeProvider>
          <RoleProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
