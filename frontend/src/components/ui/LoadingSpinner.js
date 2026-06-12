import React from 'react';

export default function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin`} />
    </div>
  );
}
