console.log("AI Coding Mentor: Content script injected successfully!");

function getPageContext() {
    const pageTitle = document.title;
    const url = window.location.href;
    
    console.log("Mentor Context Grabbed:");
    console.log("- Title:", pageTitle);
    console.log("- URL:", url);
    
    return { title: pageTitle, url: url };
}

window.addEventListener('load', () => {
    getPageContext();
});