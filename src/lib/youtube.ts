export function isValidYoutubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})$/,
    /^(https?:\/\/)?(www\.)?(youtu\.be\/)([a-zA-Z0-9_-]{11})$/,
  ];
  return patterns.some(pattern => pattern.test(url));
}

export function getYoutubeEmbedUrl(url: string): string | null {
  if (!isValidYoutubeUrl(url)) return null;

  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYoutubeThumbnailUrl(url: string): string | null {
  if (!isValidYoutubeUrl(url)) return null;

  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
  if (!videoId) return null;

  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
} 