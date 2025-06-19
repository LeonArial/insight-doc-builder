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
    <div className={`border-2 border-primary-500 shadow-lg rounded-xl overflow-hidden bg-slate-800 ${className}`}>
        <div className="bg-slate-700 p-2 border-b border-slate-600 flex items-center">
            <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={addImage}
                className="text-white bg-transparent hover:bg-slate-600"
            >
                <ImageIcon className="w-4 h-4" />
            </Button>
        </div>
        <EditorContent 
            editor={editor} 
            className="prose prose-invert max-w-none p-6 min-h-[50px] text-base bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
        />
    </div>
)
}

export default RichTextEditor
