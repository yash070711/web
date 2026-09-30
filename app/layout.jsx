import './globals.css';
import StudioShell from '../src/components/StudioShell';
export const metadata={title:'VeriDex ? Product Studio',description:'Commercial insurance product configuration'};
export default function RootLayout({children}) {return <html lang="en"><body><StudioShell>{children}</StudioShell></body></html>;}
