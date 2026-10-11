/**
 * Comprehensive HTML Entity Decoder and Text Sanitizer
 * Solves raw HTML entities such as &aacute;, &agrave;, &amp;, &#39;, &quot;, &ocirc;, &nbsp;, etc.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&aacute;': 'á',
  '&agrave;': 'à',
  '&ả;': 'ả',
  '&atilde;': 'ã',
  '&ạ;': 'ạ',
  '&Aacute;': 'Á',
  '&Agrave;': 'À',
  '&Atilde;': 'Ã',
  '&acirc;': 'â',
  '&ấ;': 'ấ',
  '&ầ;': 'ầ',
  '&ẩ;': 'ẩ',
  '&ẫ;': 'ẫ',
  '&ậ;': 'ậ',
  '&Acirc;': 'Â',
  '&abreve;': 'ă',
  '&ắ;': 'ắ',
  '&ằ;': 'ằ',
  '&ẳ;': 'ẳ',
  '&ẵ;': 'ẵ',
  '&ặ;': 'ặ',
  '&eacute;': 'é',
  '&egrave;': 'è',
  '&ẻ;': 'ẻ',
  '&ẽ;': 'ẽ',
  '&ẹ;': 'ẹ',
  '&Eacute;': 'É',
  '&Egrave;': 'È',
  '&ecirc;': 'ê',
  '&ế;': 'ế',
  '&ề;': 'ề',
  '&ể;': 'ể',
  '&ễ;': 'ễ',
  '&ệ;': 'ệ',
  '&Ecirc;': 'Ê',
  '&iacute;': 'í',
  '&igrave;': 'ì',
  '&ỉ;': 'ỉ',
  '&ĩ;': 'ĩ',
  '&ị;': 'ị',
  '&Iacute;': 'Í',
  '&Igrave;': 'Ì',
  '&oacute;': 'ó',
  '&ograve;': 'ò',
  '&ỏ;': 'ỏ',
  '&otilde;': 'õ',
  '&ọ;': 'ọ',
  '&Oacute;': 'Ó',
  '&Ograve;': 'Ò',
  '&Otilde;': 'Õ',
  '&ocirc;': 'ô',
  '&ố;': 'ố',
  '&ồ;': 'ồ',
  '&ổ;': 'ổ',
  '&ỗ;': 'ỗ',
  '&ộ;': 'ộ',
  '&Ocirc;': 'Ô',
  '&ơ;': 'ơ',
  '&ớ;': 'ớ',
  '&ờ;': 'ờ',
  '&ở;': 'ở',
  '&ỡ;': 'ỡ',
  '&ợ;': 'ợ',
  '&uacute;': 'ú',
  '&ugrave;': 'ù',
  '&ủ;': 'ủ',
  '&utilde;': 'ũ',
  '&ụ;': 'ụ',
  '&Uacute;': 'Ú',
  '&Ugrave;': 'Ù',
  '&ư;': 'ư',
  '&ứ;': 'ứ',
  '&ừ;': 'ừ',
  '&ử;': 'ử',
  '&ữ;': 'ữ',
  '&ự;': 'ự',
  '&yacute;': 'ý',
  '&ygrave;': 'ỳ',
  '&ỷ;': 'ỷ',
  '&ytilde;': 'ỹ',
  '&ỵ;': 'ỵ',
  '&Yacute;': 'Ý',
  '&đ;': 'đ',
  '&Dstrok;': 'Đ',
  '&amp;': '&',
  '&quot;': '"',
  '&#34;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&ndash;': '–',
  '&mdash;': '—',
  '&hellip;': '…',
  '&laquo;': '«',
  '&raquo;': '»',
  '&bull;': '•',
};

/**
 * Decodes all HTML entities (named, numeric decimal, hex) safely with multi-pass protection.
 */
export function decodeHtmlEntities(str: string | null | undefined): string {
  if (!str) return '';
  let result = String(str);

  // Strip CDATA wrapper if present
  result = result.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');

  // Multi-pass decoding (up to 3 passes) to resolve nested escapes like &amp;quot; -> &quot; -> "
  for (let pass = 0; pass < 3; pass++) {
    const prev = result;

    // 1. Replace known common named entities
    for (const [entity, replacement] of Object.entries(HTML_ENTITY_MAP)) {
      if (result.includes(entity)) {
        result = result.replaceAll(entity, replacement);
      }
    }

    // 2. Numeric decimal entities &#123;
    result = result.replace(/&#(\d+);/g, (_, dec) => {
      try {
        const code = parseInt(dec, 10);
        return code > 0 && code < 65536 ? String.fromCharCode(code) : _;
      } catch {
        return _;
      }
    });

    // 3. Hexadecimal entities &#xABC;
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        const code = parseInt(hex, 16);
        return code > 0 && code < 65536 ? String.fromCharCode(code) : _;
      } catch {
        return _;
      }
    });

    if (result === prev || !result.includes('&')) break;
  }

  // Browser DOMParser fallback if running in client and entities still remain
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined' && result.includes('&')) {
    try {
      const doc = new DOMParser().parseFromString(result, 'text/html');
      const decoded = doc.body.textContent;
      if (decoded) {
        result = decoded;
      }
    } catch {
      // ignore
    }
  }

  return result.trim();
}

/**
 * Strips HTML tags, decodes entities, removes CDATA, cleans up img alt tags, and standardizes title typography.
 */
export function cleanHtmlTitle(title: string | undefined | null, fallbackSnippet?: string): string {
  if (!title) return fallbackSnippet?.substring(0, 100) || 'Tin tức nghiệp vụ Bộ Tài chính';
  
  let decoded = decodeHtmlEntities(title);

  // Extract alt-text if title is an image tag
  if (decoded.includes('<img') || decoded.includes('<IMG')) {
    const match = decoded.match(/alt=["']([^"']+)["']/i);
    if (match && match[1] && !match[1].includes('Ảnh có sử dụng')) {
      decoded = match[1];
    } else {
      decoded = fallbackSnippet?.substring(0, 100) || 'Tin tức nghiệp vụ Bộ Tài chính';
    }
  }

  // Strip all remaining HTML tags
  decoded = decoded.replace(/<[^>]+>/g, ' ');

  // Standardize multiple spaces, newlines, tabs
  decoded = decoded.replace(/\s+/g, ' ').trim();

  // Strip leading/trailing stray quotes or colon artifacts
  decoded = decoded.replace(/^["'“”«»:\s]+|["'“”«»:\s]+$/g, '').trim();

  return decoded || fallbackSnippet?.substring(0, 100) || 'Tin tức nghiệp vụ Bộ Tài chính';
}
