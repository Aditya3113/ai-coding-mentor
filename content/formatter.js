function handleFormatting() {
    console.log("Searching for LeetCode format button...");
    const buttons = Array.from(document.querySelectorAll('button'));
    const formatBtn = buttons.find(b => {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        const tooltip = (b.getAttribute('data-tooltip-content') || '').toLowerCase();
        const tooltipId = (b.getAttribute('data-tooltip-id') || '').toLowerCase();
        return aria.includes('format') || tooltip.includes('format') || tooltipId.includes('format');
    });

    if (formatBtn) {
        formatBtn.click();
    } else {
        const editorDiv = document.querySelector('.monaco-editor') || document.activeElement;
        if (editorDiv) {
            editorDiv.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'f', code: 'KeyF', keyCode: 70, shiftKey: true, altKey: true, bubbles: true
            }));
        }
    }
}