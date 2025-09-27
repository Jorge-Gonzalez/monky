import React from 'react';
import { Macro } from '../../store/useMacroStore';
import MacroItem from './MacroItem';
import { t } from '../../lib/i18n';

type MacroListProps = {
  macros: Macro[];
};

export default function MacroList({ macros }: MacroListProps) {
  if (!macros || macros.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-4">{t('popup.noMacros')}</p>;
  }
  return <div className="flex flex-col gap-2">{macros.map(macro => <MacroItem key={macro.id} macro={macro} />)}</div>;
}