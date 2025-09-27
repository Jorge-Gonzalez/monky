import React, { useState } from 'react';
import { useMacroStore, type Macro } from '../../store/useMacroStore';
import { t } from '../../lib/i18n';

type MacroItemProps = {
  macro: Macro;
};

export default function MacroItem({ macro }: MacroItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const deleteMacro = useMacroStore(s => s.deleteMacro);

  const handleEdit = () => {
    chrome.tabs.create({ url: `src/editor/index.html?id=${macro.id}` });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 shadow-sm">
      <button className="w-full flex justify-between text-left items-center" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{macro.command}</span>
        <span className="text-gray-500 dark:text-gray-400 text-xs transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
            {macro.text}
          </pre>
          <div className="flex gap-2 mt-2">
            <button className="px-2 py-1 text-white bg-yellow-600 hover:bg-yellow-700 rounded text-sm" onClick={handleEdit}>✏️ {t('popup.edit')}</button>
            <button className="px-2 py-1 text-white bg-red-600 hover:bg-red-700 rounded text-sm" onClick={() => deleteMacro(macro.id)}>🗑️ {t('popup.delete')}</button>
          </div>
        </div>
      )}
    </div>
  );
}