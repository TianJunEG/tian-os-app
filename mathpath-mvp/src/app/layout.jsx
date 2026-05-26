import './globals.css';

export const metadata = {
  title: 'MathPath · Tian OS',
  description: 'Adaptive math mastery — calm, premium, mastery-focused practice.',
};

export const viewport = {
  themeColor: '#FAFAF7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Tian OS type: Fraunces display, Inter text, JetBrains Mono numerals. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* KaTeX styles + fonts for stacked/responsive math rendering. */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* Mobile-first white app surface, centred on the ivory stage. */}
        <div className="app-surface">{children}</div>
      </body>
    </html>
  );
}
