import { useState } from 'react';

const palette = [
  'from-[#d94f2b]/85 to-[#f59e0b]/70',
  'from-[#1d4ed8]/85 to-[#38bdf8]/70',
  'from-[#065f46]/85 to-[#10b981]/70',
  'from-[#7c2d12]/85 to-[#d97706]/70',
];

const pickPalette = (seed = '') => {
  const value = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[value % palette.length];
};

const NewsImage = ({
  src,
  alt,
  title,
  source,
  className,
  fallbackClassName = '',
  eager = false,
}) => {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        className={`flex items-end overflow-hidden bg-gradient-to-br ${pickPalette(
          title || source || alt
        )} ${fallbackClassName || className}`}
      >
        <div className="w-full bg-gradient-to-t from-black/55 to-transparent p-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
            {source || 'Live Coverage'}
          </p>
          <p className="mt-2 font-display text-lg leading-6">
            {title || alt || 'Latest news coverage'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || title || 'News image'}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default NewsImage;
