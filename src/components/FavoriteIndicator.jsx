import { Star } from 'lucide-react';

export default function FavoriteIndicator({ isFavorite }) {
  if (!isFavorite) return null;

  return (
    <div className="absolute top-3 right-3 z-10">
      <Star className="w-4 h-4 text-blue-200/60 fill-blue-400/20
                      drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]" />
    </div>
  );
}
