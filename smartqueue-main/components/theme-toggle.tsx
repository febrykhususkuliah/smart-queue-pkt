'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
      style={{
        backgroundColor: theme === 'dark' 
          ? '#334155'
          : '#E2E8F0',
      }}
      aria-label={`Ganti ke mode ${theme === 'light' ? 'gelap' : 'terang'}`}
      title={`Mode saat ini: ${theme === 'light' ? 'Terang' : 'Gelap'}`}
    >
      {/* Slider background dengan transition smooth */}
      <span
        className="absolute h-7 w-7 rounded-full shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center"
        style={{
          backgroundColor: theme === 'dark' 
            ? '#1E293B'
            : '#FFFFFF',
          transform: theme === 'dark' 
            ? 'translateX(26px)' 
            : 'translateX(2px)',
        }}
      >
        {theme === 'dark' ? (
          <Moon 
            className="h-4 w-4 text-blue-400 transition-transform duration-300"
            style={{
              transform: 'rotate(0deg)',
            }}
          />
        ) : (
          <Sun 
            className="h-4 w-4 text-yellow-500 transition-transform duration-300"
            style={{
              transform: 'rotate(0deg)',
            }}
          />
        )}
      </span>
    </button>
  );
}
