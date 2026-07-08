const THEMES = {
    "monokai": `
        .monaco-editor, .monaco-editor-background, .monaco-editor .margin { background-color: #272822 !important; }
        .monaco-editor .view-lines { background-color: transparent !important; }
    `,
    "github": `
        .monaco-editor, .monaco-editor-background, .monaco-editor .margin { background-color: #0d1117 !important; }
        .monaco-editor .view-lines { background-color: transparent !important; }
    `
};

function applyTheme(themeName) {
    let styleTag = document.getElementById('ai-mentor-theme');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'ai-mentor-theme';
        document.head.appendChild(styleTag);
    }
    
    if (themeName === "default" || !THEMES[themeName]) {
        styleTag.innerHTML = '';
    } else {
        styleTag.innerHTML = THEMES[themeName];
    }
}