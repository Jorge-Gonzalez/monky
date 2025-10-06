import React, { useEffect, useState } from 'react';
import { Macro } from '../types';

interface MacroSuggestionsProps {
  macros: Macro[];
  buffer: string;
  position: { x: number; y: number };
  isVisible: boolean;
  selectedIndex: number;
  onSelectMacro: (macro: Macro) => void;
}

export function MacroSuggestions({ 
  macros, 
  buffer, 
  position, 
  isVisible, 
  selectedIndex,
  onSelectMacro 
}: MacroSuggestionsProps) {
  const [filteredMacros, setFilteredMacros] = useState<Macro[]>([]);

  useEffect(() => {
    if (!buffer || buffer.length < 2) {
      setFilteredMacros([]);
      return;
    }

    const matches = macros
      .filter(macro => macro.command.toLowerCase().startsWith(buffer.toLowerCase()))
      .slice(0, 5); // Limit to 5 suggestions to avoid clutter

    setFilteredMacros(matches);
  }, [macros, buffer]);

  if (!isVisible || filteredMacros.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 py-1 min-w-[200px] max-w-[300px]"
      style={{ 
        left: position.x,
        top: position.y + 20, // Offset below cursor
        fontSize: '14px'
      }}
    >
      {filteredMacros.map((macro, index) => (
        <div
          key={macro.id}
          className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
            index === selectedIndex 
              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          onClick={() => onSelectMacro(macro)}
        >
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
              {macro.command}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {macro.text.length > 30 ? `${macro.text.substring(0, 30)}...` : macro.text}
            </div>
          </div>
          {index === selectedIndex && (
            <div className="ml-2 text-xs text-blue-500 dark:text-blue-400">
              ⭾
            </div>
          )}
        </div>
      ))}
      
      {filteredMacros.length > 0 && (
        <div className="px-3 py-1 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Tab</kbd> select
        </div>
      )}
    </div>
  );
}