'use client';

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface IdeaCardProps {
  title: string;
  onClick: () => void;
  selected?: boolean;
  loading?: boolean;
}

export default function IdeaCard({ title, onClick, selected, loading }: IdeaCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) {
      onClick();
    }
  };

  return (
    <button
      className={`
        relative w-full p-6 rounded-xl
        border-2 transition-all duration-300 ease-in-out
        ${selected 
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' 
          : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-xl hover:scale-[1.02]'
        }
        ${loading 
          ? 'opacity-75 cursor-not-allowed pointer-events-none' 
          : 'cursor-pointer active:scale-[0.98]'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        transform-gpu will-change-transform
      `}
      onClick={handleClick}
      disabled={loading}
      type="button"
      aria-busy={loading}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-gray-900 transition-colors duration-200">
          {title}
        </h3>
        {loading && (
          <div className="ml-4 flex-shrink-0">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
    </button>
  );
} 