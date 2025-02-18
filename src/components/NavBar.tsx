'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Brand from './Brand';

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 md:h-12">
          <Brand />
          <div className="flex space-x-2">
            <Link 
              href="/"
              className={`px-2 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === '/' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              ❄️ Chill
            </Link>
            <Link 
              href="/flash"
              className={`px-2 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === '/flash' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              ⚡ Flash
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}