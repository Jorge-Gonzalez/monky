# Monky Project Architecture Diagram

```mermaid
graph TB
    subgraph "Project Root"
        package["package.json"]
        manifest["manifest.config.ts"]
        vite["vite.config.ts"]
        tsconfig["tsconfig.json"]
        eslint["eslint.config.js"]
        prettier[".prettierrc"]
        tailwind["tailwind.config.js"]
        postcss["postcss.config.js"]
    end
    
    subgraph "Source Code (src/)"
        styles["styles.css"]
        types["types.ts"]
        
        subgraph "Background (Service Worker)"
            bg_index["background/index.ts"]
        end
        
        subgraph "Content Script"
            content_index["content/main.ts"]
            content_lib["content/lib/*"]
            content_utils["content/utils/*"]
        end
        
        subgraph "Popup UI"
            popup_index["popup/index.html"]
            popup_main["popup/main.tsx"]
            popup_components["popup/components/*"]
        end
        
        subgraph "Options Page"
            options_index["options/index.html"]
            options_main["options/main.tsx"]
            options_components["options/components/*"]
        end
        
        subgraph "Editor"
            editor_index["editor/index.html"]
            editor_main["editor/main.tsx"]
            editor_components["editor/components/*"]
        end
        
        subgraph "Shared Libraries"
            lib["lib/*"]
        end
        
        subgraph "State Store"
            store["store/*"]
        end
        
        subgraph "Configuration"
            config["config/*"]
        end
        
        subgraph "Themes"
            theme["theme/*"]
        end
    end
    
    subgraph "Public Assets"
        public["public/*"]
        icons["public/icons/*"]
    end
    
    subgraph "Development Tools"
        scripts["scripts/*"]
        tests["tests/*"]
        vitest_setup["vitest.setup.ts"]
    end
    
    subgraph "Build Output"
        dist["dist/ (generated)"]
    end
    
    %% Dependencies
    package --> manifest
    package --> vite
    vite --> manifest
    tsconfig --> all_src
    
    manifest --> bg_index
    manifest --> content_index
    manifest --> popup_index
    manifest --> options_index
    manifest --> editor_index
    
    bg_index --> store
    content_index --> store
    content_index --> lib
    popup_main --> store
    popup_main --> lib
    options_main --> store
    editor_main --> lib
    
    styles --> all_ui
    types --> all_src
    theme --> all_ui
    
    popup_components --> types
    options_components --> types
    editor_components --> types
    
    lib --> content_lib
    lib --> content_utils
    
    subgraph "all_src [All Source Files]"
        A1["background/*"]
        A2["content/*"]
        A3["popup/*"]
        A4["options/*"]
        A5["editor/*"]
        A6["lib/*"]
        A7["store/*"]
        A8["config/*"]
        A9["theme/*"]
    end
    
    subgraph "all_ui [All UI Components]"
        B1["popup/*"]
        B2["options/*"]
        B3["editor/*"]
    end
    
    linkStyle default stroke:#888,stroke-width:1px
    
    style "Project Root" fill:#e1f5fe
    style "Source Code (src/)" fill:#f3e5f5
    style "Build Output" fill:#e8f5e8
    style "Development Tools" fill:#fff3e0
    style dist fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
```

## Project Overview

This is a **Chrome Extension** built with:
- **Framework**: React + Vite
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Testing**: Vitest & React Testing Library

## Key Components

1. **Background Service Worker**: Handles persistent extension functionality
2. **Content Script**: Injects functionality into web pages
3. **Popup UI**: Quick access interface for users
4. **Options Page**: Configuration settings
5. **Editor**: Rich text editor for creating macros
6. **Store**: Global state management with Zustand
7. **Lib**: Shared utilities and functions
8. **Theme**: Styling and theme management

## Build Process

The project uses the `@crxjs/vite-plugin` to build a Chrome Extension with Manifest V3, outputting to the `dist/` directory.