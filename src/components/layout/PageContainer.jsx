import React from 'react';

export default function PageContainer({ children, width = 'max-w-7xl' }) {
  return <main className={`flex-1 ${width} w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10 animate-fadeIn`}>{children}</main>;
}