'use client';

import { useEffect, useRef } from 'react';
import { FiBold, FiItalic, FiList, FiUnderline } from 'react-icons/fi';
import { MdFormatListNumbered } from 'react-icons/md';
import { useIntl } from 'react-intl';
import './RichTextEditor.scss';

const isEmptyHtml = (html) =>
    !(html || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

const RichTextEditor = ({ value = '', onChange, placeholder = '', error = false }) => {
    const intl = useIntl();
    const editorRef = useRef(null);
    const skipSyncRef = useRef(false);

    useEffect(() => {
        if (!editorRef.current || skipSyncRef.current) {
            skipSyncRef.current = false;
            return;
        }
        const next = value || '';
        if (editorRef.current.innerHTML !== next) {
            editorRef.current.innerHTML = next;
        }
    }, [value]);

    const emitChange = () => {
        skipSyncRef.current = true;
        onChange?.(editorRef.current?.innerHTML || '');
    };

    const runCommand = (command) => {
        editorRef.current?.focus();
        document.execCommand(command, false, null);
        emitChange();
    };

    return (
        <div className={`rich-text-editor ${error ? 'is-invalid' : ''}`}>
            <div className="rich-text-editor__toolbar">
                <button
                    type="button"
                    title={intl.formatMessage({ id: 'forms.bold' })}
                    onClick={() => runCommand('bold')}
                >
                    <FiBold size={16} />
                </button>
                <button
                    type="button"
                    title={intl.formatMessage({ id: 'forms.italic' })}
                    onClick={() => runCommand('italic')}
                >
                    <FiItalic size={16} />
                </button>
                <button
                    type="button"
                    title={intl.formatMessage({ id: 'forms.underline' })}
                    onClick={() => runCommand('underline')}
                >
                    <FiUnderline size={16} />
                </button>
                <span className="rich-text-editor__divider" />
                <button
                    type="button"
                    title={intl.formatMessage({ id: 'forms.bulletList' })}
                    onClick={() => runCommand('insertUnorderedList')}
                >
                    <FiList size={16} />
                </button>
                <button
                    type="button"
                    title={intl.formatMessage({ id: 'forms.numberedList' })}
                    onClick={() => runCommand('insertOrderedList')}
                >
                    <MdFormatListNumbered size={18} />
                </button>
            </div>
            <div
                ref={editorRef}
                className={`rich-text-editor__content ${isEmptyHtml(value) ? 'is-empty' : ''}`}
                contentEditable
                role="textbox"
                aria-multiline="true"
                data-placeholder={placeholder}
                suppressContentEditableWarning
                onInput={emitChange}
                onBlur={emitChange}
            />
        </div>
    );
};

export default RichTextEditor;
