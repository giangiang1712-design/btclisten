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
 * Decodes all HTML entities (named, numeric decimal, hex) safely.
 */
export function decodeHtmlEntities(str: string | null | undefined): string {
  if (!str) return '';
  let result = String(str);

  // 1. Replace known common named entities
  for (const [entity, replacement] of Object.entries(HTML_ENTITY_MAP)) {
    if (result.includes(entity)) {
      result = result.replaceAll(entity, replacement);
    }
  }

  // 2. Numeric decimal entities &#123;
  result = result.replace(/&#(\d+);/g, (_, dec) => {
    try {
      return String.fromCharCode(parseInt(dec, 10));
    } catch {
      return _;
    }
  });

  // 3. Hexadecimal entities &#xABC;
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return _;
    }
  });

  // 4. Browser DOMParser fallback if running in client
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
 * Strips HTML tags, decodes entities, and extracts alt-text from RSS image markup.
 */
export function cleanHtmlTitle(title: string | undefined | null, fallbackSnippet?: string): string {
  if (!title) return fallbackSnippet?.substring(0, 100) || 'Tin tức nghiệp vụ Bộ Tài chính';
  let decoded = decodeHtmlEntities(title);
  if (decoded.includes('<img')) {
    const match = decoded.match(/alt=["']([^"']+)["']/i);
    if (match && match[1] && !match[1].includes('Ảnh có sử dụng')) {
      decoded = match[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    } else {
      decoded = fallbackSnippet?.substring(0, 100) || 'Tin tức nghiệp vụ Bộ Tài chính';
    }
  }
  return decoded.replace(/<[^>]+>/g, '').trim();
}
