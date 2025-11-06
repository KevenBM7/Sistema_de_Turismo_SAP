import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link'; // Mantener esta
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link2, TextQuote, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { LineHeight } from './line-height'; // Importar la nueva extensión

const EditorToolbar = ({ editor }) => {
  const [showLineHeightOptions, setShowLineHeightOptions] = useState(false);
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-toolbar">
      <button type="button" title="Negrita" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>
        <Bold size={18} />
      </button>
      <button type="button" title="Cursiva" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>
        <Italic size={18} />
      </button>
      <button type="button" title="Subrayado" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}>
        <UnderlineIcon size={18} />
      </button>
      <button type="button" title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>
        <List size={18} />
      </button>
      <button type="button" title="Lista Numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>
        <ListOrdered size={18} />
      </button>
      <button type="button" title="Enlace" onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''}>
        <Link2 size={18} />
      </button>
      <button type="button" title="Alinear Izquierda" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}>
        <AlignLeft size={18} />
      </button>
      <button type="button" title="Alinear Centro" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}>
        <AlignCenter size={18} />
      </button>
      <button type="button" title="Alinear Derecha" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}>
        <AlignRight size={18} />
      </button>
      <button type="button" title="Justificar" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}>
        <AlignJustify size={18} />
      </button>
      <div className="toolbar-dropdown-container">
        <button type="button" title="Interlineado" onClick={() => setShowLineHeightOptions(!showLineHeightOptions)}>
          <TextQuote size={18} />
        </button>
        {showLineHeightOptions && (
          <div className="toolbar-dropdown-menu">
            <button onClick={() => { editor.chain().focus().setLineHeight('1.2').run(); setShowLineHeightOptions(false); }}>
              Reducido
            </button>
            <button onClick={() => { editor.chain().focus().setLineHeight('1.5').run(); setShowLineHeightOptions(false); }}>
              Normal
            </button>
            <button onClick={() => { editor.chain().focus().setLineHeight('2').run(); setShowLineHeightOptions(false); }}>
              Amplio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const RichTextEditor = ({ content, onChange, readOnly }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Desactivar las extensiones que vamos a configurar manualmente
        link: false,
        underline: false,
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline, // Usar la extensión importada
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      LineHeight,
    ],
    content: content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.getHTML() !== content) {
      // Sincroniza el contenido del editor si la prop `content` cambia
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  return (
    <div className="tiptap-editor-container">
      {!readOnly && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;