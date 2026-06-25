import React from 'react';

export const formatTextWithLinks = (text: string) => {
  if (!text) return text;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          // Truncate long URLs
          const displayUrl = part.length > 40 ? part.substring(0, 38) + '...' : part;
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 break-all"
              onClick={(e) => e.stopPropagation()}
              title={part}
            >
              {displayUrl}
            </a>
          );
        }
        return <span key={index} className="break-words">{part}</span>;
      })}
    </>
  );
};
