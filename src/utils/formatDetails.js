/**
 * Format task details text
 * - Preserve line breaks
 * - Convert URLs to clickable links (open in new tab)
 */

export function formatDetailsText(text) {
  if (!text) return null;

  // URL regex: matches http(s)://, ftp://, www. patterns
  const urlRegex = /(https?:\/\/[^\s]+|ftp:\/\/[^\s]+|www\.[^\s]+)/gi;

  // Split by newlines and URLs
  const parts = text.split('\n').map((line, lineIndex) => {
    const lineParts = [];
    let lastIndex = 0;

    // Find all URLs in this line
    let match;
    const urlMatches = [];
    while ((match = urlRegex.exec(line)) !== null) {
      urlMatches.push({ url: match[0], index: match.index, length: match[0].length });
    }

    // Reset regex lastIndex for next iteration
    urlRegex.lastIndex = 0;

    if (urlMatches.length === 0) {
      // No URLs in this line, return as is
      return (
        <div key={`line-${lineIndex}`}>
          {line}
        </div>
      );
    }

    // Build line with URLs converted to links
    urlMatches.forEach((urlMatch, urlIndex) => {
      // Add text before URL
      if (urlMatch.index > lastIndex) {
        lineParts.push(line.substring(lastIndex, urlMatch.index));
      }

      // Add URL as link
      let href = urlMatch.url;
      if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('ftp://')) {
        href = 'https://' + href; // Add https to www links
      }

      lineParts.push(
        <a
          key={`url-${lineIndex}-${urlIndex}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {urlMatch.url}
        </a>
      );

      lastIndex = urlMatch.index + urlMatch.length;
    });

    // Add remaining text after last URL
    if (lastIndex < line.length) {
      lineParts.push(line.substring(lastIndex));
    }

    return (
      <div key={`line-${lineIndex}`}>
        {lineParts}
      </div>
    );
  });

  return parts;
}
