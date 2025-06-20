import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import React, { useEffect } from 'react'
import { Button } from './button'
import { ImageIcon } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, className }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [value])

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64 = e.target?.result as string
          editor?.chain().focus().setImage({ src: base64 }).run()
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  if (!editor) {
    return null
  }

return (
    <div className={`border-2 border-slate-600 hover:border-primary-500 rounded-lg overflow-hidden bg-slate-800 transition-all duration-200 ${className || ''}`}>
        <div className="bg-slate-700/50 border-b border-slate-600 flex items-center p-1">
            <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={addImage}
                className="text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
                <ImageIcon className="w-4 h-4 mr-1" />
            </Button>
        </div>
        <div className="p-1 bg-slate-700">
            <EditorContent 
                editor={editor} 
            />
        </div>
    </div>
)
}

export default RichTextEditor
