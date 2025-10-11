   const theme = useMacroStore(state => state.config.theme);

  // deleted
    useThemeColors(containerRef, theme, isVisible);

  
  
  //a dded
  // Theme colors definition
  const getThemeColors = (isDark: boolean) => {
    if (isDark) {
      return {
        '--bg-primary': '#1f2937',
        '--bg-secondary': '#374151',
        '--bg-tertiary': 'rgba(59, 130, 246, 0.2)',
        '--text-primary': '#f3f4f6',
        '--text-secondary': '#9ca3af',
        '--text-accent': '#60a5fa',
        '--border-primary': '#374151',
        '--border-secondary': '#374151',
        '--kbd-bg': '#4b5563',
        '--kbd-border': '#6b7280',
        '--shadow-color': 'rgba(0, 0, 0, 0.4)',
      };
    } else {
      return {
        '--bg-primary': '#ededed',
        '--bg-secondary': '#e8e9e9', 
        '--bg-tertiary': '#dee5ed',
        '--text-primary': '#101624',
        '--text-secondary': '#636a76',
        '--text-accent': '#3679e4',
        '--border-primary': '#d6d8dc',
        '--border-secondary': '#e1e2e4',
        '--kbd-bg': '#e1e2e4',
        '--kbd-border': '#c3c7cb',
        '--shadow-color': 'rgba(0, 0, 0, 0.25)',
      };
    }
  };
  
  // Apply theme when component becomes visible or theme changes
  useEffect(() => {
    if (!isVisible) return;
    
    // Use a small delay to ensure DOM is ready
    const applyTheme = () => {
      if (!containerRef.current) {
        // Retry after a short delay
        setTimeout(applyTheme, 10);
        return;
      }
      
      const element = containerRef.current;
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const colors = getThemeColors(isDark);
      
      // Apply each CSS custom property
      for (const property in colors) {
        if (colors.hasOwnProperty(property)) {
          const value = colors[property];
          element.style.setProperty(property, value);
        }
      }
      
      // Add theme classes
      element.classList.toggle('dark', isDark);
      element.classList.toggle('light', !isDark);
    };
    
    // Start the theme application process
    applyTheme();
  }, [isVisible, theme]);
  
  // Additional effect to apply theme after DOM is definitely ready
  useEffect(() => {
    if (isVisible && containerRef.current) {
      const element = containerRef.current;
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const colors = getThemeColors(isDark);
      
      // Apply colors
      for (const property in colors) {
        if (colors.hasOwnProperty(property)) {
          const value = colors[property];
          element.style.setProperty(property, value);
        }
      }
      
      element.classList.toggle('dark', isDark);
      element.classList.toggle('light', !isDark);
    }
  });


  // ----------------------------



    return (
    <div 
      ref={containerRef}
      className="macro-suggestions-container"
      style={{ 
        left: position.left,
        top: position.top,
        // added
        position: 'fixed',
        zIndex: 2147483647
        //end