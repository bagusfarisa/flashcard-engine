export default function Loading() {
  return (
    <div className="w-full h-[80vh] min-h-[400px] max-h-[600px] flex flex-col items-center justify-center p-4 animate-pulse">
      {/* Kanji Card Skeleton */}
      <div className="w-full max-w-lg aspect-[3/4] bg-gray-200 rounded-xl mb-8 flex items-center justify-center">
        <div className="w-32 h-32 bg-gray-300 rounded-lg" />
      </div>
      
      {/* Input Field Skeleton */}
      <div className="w-full max-w-md h-12 bg-gray-200 rounded-lg mb-4" />
      
      {/* Controls Skeleton */}
      <div className="flex gap-4 mt-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}
