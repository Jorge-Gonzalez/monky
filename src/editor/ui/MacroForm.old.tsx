import React, { useEffect, useState, useRef } from 'react'
import MediumEditor from 'medium-editor'
import { useMacroStore } from '../../store/useMacroStore'
import { createMacroLocalFirst, updateMacroLocalFirst } from '../../lib/sync'
import { getErrorMessage } from '../../lib/errors'
import { t } from '../../lib/i18n'
import 'medium-editor/dist/css/medium-editor.css'
import 'medium-editor/dist/css/themes/default.css'

export default function MacroForm({ editing, onDone }:{ editing:any|null, onDone:()=>void }){
  const addMacro = useMacroStore(s=>s.addMacro)
  const updateMacro = useMacroStore(s=>s.updateMacro)
  const [command, setCommand] = useState('')
  const [text, setText] = useState('')
  const [isSensitive, setSensitive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for snippets
        codeBlock: false, // Disable code blocks
        link: false, // Disable StarterKit's basic link to avoid conflict
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        }
      })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none p-3 min-h-[150px]',
      },
    },
    onUpdate: ({ editor }) => {
      setText(editor.getHTML())
    }
  })

  useEffect(()=>{
    if (editing){ 
      setCommand(editing.command)
      // Use html content if available, fallback to text for legacy macros
      const content = editing.html || editing.text
      setText(content)
      setSensitive(!!editing.is_sensitive)
      // Update editor content
      if (editor) {
        editor.commands.setContent(content)
      }
    } else { 
      setCommand('')
      setText('')
      setSensitive(false)
      // Clear editor content
      if (editor) {
        editor.commands.setContent('')
      }
    }
    setError(null)
  }, [editing, editor])

  // Clear error when user starts typing
  useEffect(() => {
    if (error) setError(null)
  }, [command, text])

  // Helper function to detect if content has rich formatting
  function hasRichFormatting(html: string): boolean {
    // Remove the outer <p> tag and check if there's any other formatting
    const withoutOuterP = html.replace(/^<p>([\s\S]*)<\/p>$/, '$1')
    
    // Check for rich formatting elements
    const richElements = /<(?:strong|b|em|i|u|ul|ol|li|br|a\s|span\s)/i
    const hasRichElements = richElements.test(withoutOuterP)
    
    // Check if content has line breaks that would need <br> tags
    const hasLineBreaks = withoutOuterP.includes('\n') || html.includes('<br')
    
    return hasRichElements || hasLineBreaks
  }
  
  // Helper function to extract plain text from HTML
  function extractPlainText(html: string): string {
    // Create a temporary element to extract text content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ''
  }  async function onSubmit(e:React.FormEvent){
    e.preventDefault()
    setError(null)
    if (!command.trim() || !text.trim()) return

    // Smart content type detection
    const hasRichContent = hasRichFormatting(text)
    const plainText = extractPlainText(text)
    
    const macroData = {
      command,
      text: plainText, // Always store clean plain text
      html: hasRichContent ? text : undefined, // Only store HTML if it has rich formatting
      contentType: hasRichContent ? 'text/html' as const : 'text/plain' as const,
      is_sensitive: isSensitive
    }

    let result
    if (editing){
      result = updateMacro(editing.id, macroData)
      if (result.success) {
        await updateMacroLocalFirst({ id: editing.id, ...macroData })
        onDone()
      }
    } else {
      const newMacro = { id: Date.now(), ...macroData }
      result = addMacro(newMacro)
      if (result.success) {
        await createMacroLocalFirst(newMacro)
        // Reset form for next entry
        setCommand('')
        setText('')
        if (editor) {
          editor.commands.setContent('')
        }
      }
    }
    if (!result.success && result.error) {
      setError(getErrorMessage(result.error, command))
    }
  }

  if (!editor) return null

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="macro-command" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('macroForm.triggerLabel')}
        </label>
        <input
          id="macro-command"
          className="border rounded p-2 w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          value={command}
          onChange={e=>setCommand(e.target.value)}
          placeholder="/sig"
          maxLength={50}
        />
      </div>

      <div>
        <label htmlFor="macro-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('macroForm.textLabel')}
        </label>
        
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border border-b-0 rounded-t-md bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
              editor.isActive('bold')
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
            title="Bold (Ctrl/Cmd+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1.5 rounded text-sm italic transition-colors ${
              editor.isActive('italic')
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
            title="Italic (Ctrl/Cmd+I)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
            title="Numbered List"
          >
            1. List
          </button>
          <button
            type="button"
            onClick={() => {
              const url = window.prompt('Enter URL:')
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              editor.isActive('link')
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
            title="Add Link"
          >
            🔗 Link
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="px-3 py-1.5 rounded text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 border border-red-300 dark:border-red-700 transition-colors"
              title="Remove Link"
            >
              ✕ Link
            </button>
          )}
        </div>

        {/* Editor */}
        <EditorContent 
          editor={editor}
          className="border rounded-b-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-auto min-h-[100px] p-3 prose prose-sm max-w-none dark:prose-invert"
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={isSensitive}
          onChange={e=>setSensitive(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        {t('macroForm.sensitiveLabel')}
      </label>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button 
          type="submit" 
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium"
        >
          {editing ? t('macroForm.updateButton') : t('macroForm.saveButton')}
        </button>
        {editing && (
          <button 
            type="button" 
            className="px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium" 
            onClick={onDone}
          >
            {t('macroForm.cancelButton')}
          </button>
        )}
      </div>
    </form>
  )
}