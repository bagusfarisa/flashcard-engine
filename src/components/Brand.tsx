import Image from 'next/image';
import Link from 'next/link';

export default function Brand() {
  return (
    <div className="flex items-center gap-2">
      <Link 
        href="/" 
        className="text-gray-800 hover:opacity-80 transition-opacity duration-200 flex items-center gap-2"
      >
        <Image
          src="/logo.svg"
          alt="Logo"
          width={24}
          height={24}
          className="w-6 h-6"
        />
        <span className="text-base sm:text-lg font-medium">Flashcard Engine</span>
      </Link>
      <a
        href="https://bagusfarisa.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] sm:text-xs text-gray-500 font-normal hover:opacity-80 transition-opacity duration-200"
      >
        by Bagus G.
      </a>
    </div>
  );
}
