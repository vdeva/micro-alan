import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// const scientifica = localFont({
//   src: [
//     {
//       path: "./fonts/scientifica.woff2",
//       weight: "400",
//       style: "normal",
//     },
//     {
//       path: "./fonts/scientificaItalic.woff2",
//       weight: "400",
//       style: "italic",
//     },
//     {
//       path: "./fonts/scientificaBold.woff2",
//       weight: "700",
//       style: "normal",
//     },
//   ],
// });

const filsonPro = localFont({
  src: [
    {
      path: "./fonts/FilsonProBlack.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/FilsonProBlackItalic.otf",
      weight: "900",
      style: "italic",
    },
    {
      path: "./fonts/FilsonProBold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/FilsonProBoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/FilsonProBook.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/FilsonProBookItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/FilsonProHeavy.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/FilsonProHeavyItalic.otf",
      weight: "800",
      style: "italic",
    },
    {
      path: "./fonts/FilsonProLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/FilsonProLightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/FilsonProMedium.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/FilsonProMediumItalic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "./fonts/FilsonProRegular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/FilsonProRegularItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/FilsonProThin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/FilsonProThinItalic.otf",
      weight: "100",
      style: "italic",
    },
  ],
});

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "microAlan",
  description: "wesh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // className={`${scientifica.className} ${geistMono.variable} antialiased`}
        className={`${filsonPro.className} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen w-full flex-row items-center justify-center bg-neutral-50">
          <div className="no-scrollbar h-[667px] w-[390px] overflow-y-scroll rounded-3xl bg-white shadow-2xl">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
