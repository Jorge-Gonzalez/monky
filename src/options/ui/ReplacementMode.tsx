import React from 'react';
import { t } from '../../lib/i18n';
import { OptionsManager } from '../managers/createOptionsManager';

interface ReplacementModeProps {
  manager: OptionsManager;
  useCommitKeys: boolean;
}

export default function ReplacementMode({ manager, useCommitKeys }: ReplacementModeProps) {
  return (
    <div className="p-4 border rounded-lg mt-4">
      <h3 className="font-bold mb-2">{t('replacementMode.title')}</h3>
      <div className="flex items-center space-x-4">
        <label className="flex items-center cursor-pointer">
          <input type="radio" name="behavior" checked={!useCommitKeys} onChange={() => manager.setUseCommitKeys(false)} className="mr-2" />
          {t('replacementMode.auto')}
        </label>
        <label className="flex items-center cursor-pointer">
          <input type="radio" name="behavior" checked={useCommitKeys} onChange={() => manager.setUseCommitKeys(true)} className="mr-2" />
          {t('replacementMode.manual')}
        </label>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        El modo automático reemplaza el texto tan pronto como sea posible, con una breve pausa si un macro más largo es posible.
      </p>
    </div>
  );
}