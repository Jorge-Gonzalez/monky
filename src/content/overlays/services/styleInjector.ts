export function createStyleInjector(styleId: string, styles: string) {

  const inject = (): void => {
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = styles;
    document.head.appendChild(style);
  };

  const remove = (): void => {
    const style = document.getElementById(styleId);
    if (style) {
      document.head.removeChild(style);
    }
  };

  return { inject, remove };
}

export type StyleInjector = ReturnType<typeof createStyleInjector>;
