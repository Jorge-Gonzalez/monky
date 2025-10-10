import React, { useEffect, useState, useRef } from 'react'
import * as MediumEditor from 'medium-editor'
import 'medium-editor/dist/css/medium-editor.css'
import 'medium-editor/dist/css/themes/default.css'
import { useMacroStore } from '../../store/useMacroStore'
import { getErrorMessage } from '../../lib/errors'
import { t } from '../../lib/i18n'
import { EditorManager } from '../managers/createEditorManager'
import { icons } from './icons'
import { Macro } from '../../types'

export default function MacroForm({ editing, onDone, manager }:{ editing: Macro | null, onDone:()=>void, manager: EditorManager }){
  const prefixes = useMacroStore(s => s.config?.prefixes || ['/'])
  const [command, setCommand] = useState(editing?.command || '')
  const [text, setText] = useState(editing?.html || editing?.text || '')
  const [isSensitive, setSensitive] = useState(!!editing?.is_sensitive)
  const [error, setError] = useState<string | null>(null)
  
  const editorRef = useRef<HTMLDivElement>(null)
  const mediumEditor = useRef<any>(null)
  const effectiveManager = manager

  // Initialize Medium Editor
  useEffect(() => {
    if (editorRef.current && !mediumEditor.current) {
      try {
        mediumEditor.current = new MediumEditor.default(editorRef.current, {
          toolbar: {
            buttons: [
              {
                name: 'bold',
                contentFA: icons.bold
              },
              {
                name: 'italic',
                contentFA: icons.italic
              },
              {
                name: 'underline',
                contentFA: icons.underline
              },
              {
                name: 'anchor',
                contentFA: icons.anchor
              },
              {
                name: 'unorderedlist',
                contentFA: icons.unorderedlist
              },
              {
                name: 'orderedlist',
                contentFA: icons.orderedlist
              },
              {
                name: 'quote',
                contentFA: icons.quote
              }
            ]
          },
          placeholder: {
            text: 'Enter your macro content...'
          },
          paste: {
            forcePlainText: false,
            cleanPastedHTML: true,
            cleanReplacements: [],
            cleanAttrs: ['class', 'style', 'dir'],
            cleanTags: ['meta']
          }
        })

        // Listen for content changes
        mediumEditor.current.subscribe('editableInput', () => {
          if (editorRef.current) {
            setText(editorRef.current.innerHTML)
          }
        })
      } catch (error) {
        console.error('Failed to initialize Medium Editor:', error)
      }
    }

    return () => {
      if (mediumEditor.current) {
        try {
          mediumEditor.current.destroy()
        } catch (error) {
          console.error('Error destroying Medium Editor:', error)
        }
        mediumEditor.current = null
      }
    }
  }, [])

  useEffect(()=>{
    if (editing){ 
      setCommand(editing.command)
      // Use html content if available, fallback to text for legacy macros
      const content = editing.html || editing.text
      setText(content)
      setSensitive(!!editing.is_sensitive)
      
      // Update editor content
      if (editorRef.current) {
        editorRef.current.innerHTML = content
      }
    } else { 
      setCommand('')
      setText('')
      setSensitive(false)
      
      // Clear editor content
      if (editorRef.current) {
        editorRef.current.innerHTML = ''
      }
    }
    setError(null)
  }, [editing])

  // Clear error when user starts typing
  useEffect(() => {
    if (error) setError(null)
  }, [command, text])

  // Form validation
  const isCommandValid = command.trim() !== '' && prefixes.some(prefix => command.startsWith(prefix))
  const isTextValid = text.trim() !== ''
  const isFormValid = isCommandValid && isTextValid
  
  // Helper function to validate command prefix
  function validateCommand(cmd: string): string | null {
    if (!cmd.trim()) return 'Command is required'
    if (!prefixes.some(prefix => cmd.startsWith(prefix))) {
      return `Command must start with one of: ${prefixes.join(', ')}`
    }
    return null
  }

  // Helper function to detect if content has rich formatting
  function hasRichFormatting(html: string): boolean {
    // Check for rich formatting elements
    const richElements = /<(?:strong|b|em|i|u|ul|ol|li|br|a\s|span\s)/i
    const hasRichElements = richElements.test(html)
    
    // Check if content has line breaks that would need <br> tags
    const hasLineBreaks = html.includes('<br')
    
    return hasRichElements || hasLineBreaks
  }

  // Helper function to traverse the DOM and extract text giving semantic meaning to lists and line breaks
  function traverse(node: Node, text: string, listCounters: number[]): string {
    if (node.nodeType === Node.TEXT_NODE) {
      // Append text content, collapsing whitespace
      let textContent = node.textContent?.replace(/\s+/g, ' ') || '';
      
      // If we're inside a blockquote, add prefix to each line
      const blockquote = (node.parentElement as HTMLElement)?.closest('blockquote');
      if (blockquote) {
        textContent = textContent.split('\n').map(line => 
          line.trim() ? `> ${line}` : line
        ).join('\n');
      }
      
      text += textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      const isBlock = ['div', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'].includes(tagName);
      const isList = ['ul', 'ol'].includes(tagName);
      const isListItem = tagName === 'li';

      // Handle line breaks for <br> tags
      if (tagName === 'br') {
        text += '\n';
        return text;
      }

      // Handle start of lists
      if (isList) {
        // Add line break before list starts (if not already at start of line)
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
        if (tagName === 'ol') {
          listCounters.push(1); // Start new ordered list counter
        }
      }
      
      // Handle blockquotes
      else if (tagName === 'blockquote') {
        // Add line break before blockquote starts (if not already at start of line)
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
      }
      
      // Handle list items
      else if (isListItem) {
        // Ensure each list item starts on a new line
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
        const parentTag = element.parentElement?.tagName.toLowerCase();
        if (parentTag === 'ol') {
          const counter = listCounters[listCounters.length - 1]++;
          text += `${counter}. `;
        } else { // Handles 'ul' and standalone 'li'
          text += '• ';
        }
      }
      
      // Handle other block elements
      else if (isBlock) {
        // Add line break before block element (if not already at start of line)
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
      }

      // Process all child nodes
      for (const child of Array.from(element.childNodes)) {
        text = traverse(child, text, listCounters);
      }

      // Handle end of elements
      if (isList) {
        if (tagName === 'ol') {
          listCounters.pop(); // End of ordered list, remove its counter
        }
        // Add extra line break after list ends for spacing
        if (!text.endsWith('\n')) {
          text += '\n';
        }
        // Add another line break for proper spacing after lists
        if (!text.endsWith('\n\n')) {
          text += '\n';
        }
      } else if (tagName === 'blockquote') {
        // Add extra line break after blockquote for spacing
        if (!text.endsWith('\n')) {
          text += '\n';
        }
        // Add another line break for proper spacing after blockquotes
        if (!text.endsWith('\n\n')) {
          text += '\n';
        }
      } else if (isBlock && !isListItem) {
        // Add line break after block elements (except list items, which are handled above)
        if (!text.endsWith('\n')) {
          text += '\n';
        }
        // Add extra line break after paragraphs for better readability
        if (tagName === 'p' && !text.endsWith('\n\n')) {
          text += '\n';
        }
      }
    }
    return text;
  }
  
  // Helper function to extract plain text from HTML
  function extractPlainText(html: string): string {
    const tempEl = document.createElement('div');
    tempEl.innerHTML = html;

    let text = '';
    const listCounters: number[] = [];

    text = traverse(tempEl, text, listCounters);
    // Clean up extra newlines and trim whitespace
    return text.replace(/\n{3,}/g, '\n\n').trim();
  }

  async function onSubmit(e:React.FormEvent){
    e.preventDefault()
    setError(null)
    
    // Validate form
    const commandError = validateCommand(command)
    if (commandError) {
      setError(commandError)
      return
    }
    
    if (!text.trim()) {
      setError('Text content is required')
      return
    }

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
    if (editing && editing.id){
      result = await effectiveManager.updateMacro(editing.id, macroData)
      if (result.success) {
        onDone()
      }
    } else {
      result = await effectiveManager.createMacro(macroData)
      if (result.success) {
        // Reset form for next entry
        setCommand('')
        setText('')
        if (editorRef.current) {
          editorRef.current.innerHTML = ''
        }
      }
    }
    if (!result.success && result.error) {
      setError(result.error)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="macro-command" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('macroForm.triggerLabel')}
        </label>
        <input
          id="macro-command"
          className={`border rounded p-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent ${
            command && !isCommandValid 
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500'
          }`}
          value={command}
          onChange={e=>setCommand(e.target.value)}
          placeholder={`e.g., ${prefixes[0]}sig`}
          maxLength={50}
        />
        {command && !isCommandValid && (
          <p className="text-red-500 text-xs mt-1">
            Command must start with: {prefixes.join(', ')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="macro-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('macroForm.textLabel')}
        </label>
        
        {/* Medium Editor */}
        <div 
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-auto min-h-[150px] p-3 medium-editor-element"
          style={{ outline: 'none', minHeight: '150px' }}
          data-placeholder="Enter your macro content..."
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
          disabled={!isFormValid}
          className={`px-4 py-2 rounded-md transition-colors duration-200 font-medium ${
            isFormValid
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
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