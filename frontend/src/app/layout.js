// app/layout.js
import './globals.css'

export const metadata = {
  title: 'Cascade - Emergency Assistance Network',
  description: 'Connect victims of emergencies with volunteers who can help',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}