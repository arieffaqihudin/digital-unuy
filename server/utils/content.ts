import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

marked.setOptions({ gfm: true, breaks: false })

export function markdownToSafeHtml(markdown: string) {
  const rendered = marked.parse(String(markdown || ''), { async: false }) as string
  return sanitizeRichHtml(rendered)
}

export function sanitizeRichHtml(value: string) {
  return sanitizeHtml(String(value || ''), {
    allowedTags: [
      'p',
      'br',
      'hr',
      'h2',
      'h3',
      'h4',
      'strong',
      'em',
      'u',
      's',
      'blockquote',
      'ul',
      'ol',
      'li',
      'a',
      'code',
      'pre',
      'img'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'loading'],
      code: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer nofollow',
          ...(attribs.target === '_blank' ? { target: '_blank' } : {})
        }
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: 'lazy' }
      })
    }
  })
}

export function plainText(value: string, max = 400) {
  const text = sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text
}
