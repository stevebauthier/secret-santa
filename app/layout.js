export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Secret Pal</title>
            </head>
            <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif', margin: 0 }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
                    {children}
                </div>
            </body>
        </html>
    );
}