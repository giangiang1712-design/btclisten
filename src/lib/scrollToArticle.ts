/**
 * scrollToArticle.ts
 * Shared utility for smoothly scrolling the viewport to a specific NewsCard
 * across both mobile swipeable views and desktop dashboard widgets.
 */

export const scrollToNewsCard = (articleId: string): boolean => {
  if (!articleId) return false;

  const cleanId = String(articleId).trim();
  if (!cleanId) return false;

  // 1. Try finding by element ID or data attribute
  let target =
    document.getElementById(`news-card-${cleanId}`) ||
    document.querySelector(`[data-article-id="${cleanId}"]`) ||
    document.getElementById(cleanId);

  // 2. Fallback: search for partial matches if IDs were prefixed or sanitized
  if (!target) {
    try {
      target =
        document.querySelector(`[id*="${cleanId}"]`) ||
        document.querySelector(`[data-article-id*="${cleanId}"]`);
    } catch {
      // Ignore selector syntax error for unusual IDs
    }
  }

  if (!target) {
    return false;
  }

  // 3. Scroll all parent horizontal containers (such as mobile swipe containers or sector sliders)
  let parent = target.parentElement;
  while (parent && parent !== document.body) {
    const computedStyle = window.getComputedStyle(parent);
    const overflowX = computedStyle.overflowX;
    if (overflowX === 'auto' || overflowX === 'scroll') {
      const targetLeft = (target as HTMLElement).offsetLeft;
      parent.scrollTo({
        left: Math.max(0, targetLeft - 24),
        behavior: 'smooth',
      });
    }
    parent = parent.parentElement;
  }

  // 4. Smooth scroll the element into view vertically and horizontally
  target.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
  });

  // 5. Apply prominent highlight animation ring to direct user attention
  const highlightClasses = [
    'ring-4',
    'ring-rose-500',
    'ring-offset-2',
    'ring-offset-slate-900',
    'shadow-2xl',
    'shadow-rose-500/40',
    'transition-all',
    'duration-300',
    'scale-[1.02]',
  ];

  target.classList.add(...highlightClasses);

  setTimeout(() => {
    target?.classList.remove('scale-[1.02]');
  }, 400);

  setTimeout(() => {
    target?.classList.remove(
      'ring-4',
      'ring-rose-500',
      'ring-offset-2',
      'ring-offset-slate-900',
      'shadow-2xl',
      'shadow-rose-500/40'
    );
  }, 3200);

  return true;
};
