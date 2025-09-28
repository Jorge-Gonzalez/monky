import React from 'react'
import MacroItem from './MacroItem'
import { Macro } from '../../types'
import { t } from '../../lib/i18n'

export default function MacroList({ macros }:{ macros:Macro[] }) {
  if (!macros?.length) return <p className="text-gray-500 text-sm">{t('macroList.noMacros')}</p>
  if (!macros?.length) return <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-4">No tienes macros aún</p>
  return <div className="flex flex-col gap-2">{macros.map(m => <MacroItem key={m.id} macro={m}/>)}</div>
}
