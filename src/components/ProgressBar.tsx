'use client';

import React from 'react';

interface ProgressBarProps {
  indeterminate?: boolean;
  className?: string;
}

export default function ProgressBar({ indeterminate = true, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full h-1 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full bg-blue-600 rounded-full ${
          indeterminate
            ? 'animate-progress-indeterminate'
            : 'animate-progress-determinate'
        }`}
      />
    </div>
  );
} 