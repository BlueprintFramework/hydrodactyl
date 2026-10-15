import { HighlightStyle } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

const highlightBackground = 'rgba(255, 255, 255, 0.04)';
const background = 'transparent';
const selection = '#34455A';
const cursor = '#ffffff';

export const ayuMirageTheme: Extension = EditorView.theme(
    {
        '&': {
            color: '#CBCCC6',
            backgroundColor: background,
            height: '100%',
            fontSize: '13px',
        },

        '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            lineHeight: '1.5',
        },

        '.cm-content': {
            caretColor: cursor,
            paddingTop: '0.75rem',
            paddingBottom: '1rem',
        },

        '&.cm-focused .cm-cursor': { borderLeftColor: cursor },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
            backgroundColor: selection,
        },

        '.cm-panels': { backgroundColor: '#111111', color: '#CBCCC6' },
        '.cm-panels.cm-panels-top': { borderBottom: '1px solid rgba(255, 255, 255, 0.06)' },
        '.cm-panels.cm-panels-bottom': { borderTop: '1px solid rgba(255, 255, 255, 0.06)' },
        '.cm-textfield': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: '#CBCCC6',
            outline: 'none',
        },
        '.cm-textfield:focus': { borderColor: 'rgba(255, 255, 255, 0.3)' },
        '.cm-button': {
            backgroundImage: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#CBCCC6',
        },
        '.cm-panel.cm-search label': { color: 'rgba(203, 204, 198, 0.7)', fontSize: '12px' },

        '.cm-searchMatch': {
            backgroundColor: '#72a1ff59',
            outline: '1px solid #457dff',
        },
        '.cm-searchMatch.cm-searchMatch-selected': {
            backgroundColor: '#6199ff2f',
        },

        '.cm-activeLine': { backgroundColor: highlightBackground },
        '.cm-selectionMatch': { backgroundColor: '#aafe661a' },

        '.cm-matchingBracket, .cm-nonmatchingBracket': {
            backgroundColor: '#bad0f847',
            outline: '1px solid #515a6b',
        },

        '.cm-gutters': {
            backgroundColor: 'transparent',
            color: 'rgba(255, 255, 255, 0.35)',
            border: 'none',
        },

        '.cm-gutterElement': {
            color: 'rgba(255, 255, 255, 0.21)',
        },

        '.cm-activeLineGutter': {
            backgroundColor: highlightBackground,
        },

        '.cm-foldPlaceholder': {
            backgroundColor: 'transparent',
            border: 'none',
            color: '#ddd',
        },

        '.cm-tooltip': {
            border: '1px solid #181a1f',
            backgroundColor: '#232834',
        },
        '.cm-tooltip-autocomplete': {
            '& > ul > li[aria-selected]': {
                backgroundColor: highlightBackground,
                color: '#CBCCC6',
            },
        },
    },
    { dark: true },
);

export const ayuMirageHighlightStyle = HighlightStyle.define([
    {
        tag: t.keyword,
        color: '#FFA759',
    },
    {
        tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
        color: '#5CCFE6',
    },
    {
        tag: [t.function(t.variableName), t.labelName],
        color: '#CBCCC6',
    },
    {
        tag: [t.color, t.constant(t.name), t.standard(t.name)],
        color: '#F29E74',
    },
    {
        tag: [t.definition(t.name), t.separator],
        color: '#CBCCC6B3',
    },
    {
        tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
        color: '#FFCC66',
    },
    {
        tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
        color: '#5CCFE6',
    },
    {
        tag: [t.meta, t.comment],
        color: '#5C6773',
    },
    {
        tag: t.strong,
        fontWeight: 'bold',
    },
    {
        tag: t.emphasis,
        fontStyle: 'italic',
    },
    {
        tag: t.strikethrough,
        textDecoration: 'line-through',
    },
    {
        tag: t.link,
        color: '#FF3333',
        textDecoration: 'underline',
    },
    {
        tag: t.heading,
        fontWeight: 'bold',
        color: '#BAE67E',
    },
    {
        tag: [t.atom, t.bool, t.special(t.variableName)],
        color: '#5CCFE6',
    },
    {
        tag: [t.processingInstruction, t.string, t.inserted],
        color: '#BAE67E',
    },
    {
        tag: t.invalid,
        color: '#FF3333',
    },
]);
