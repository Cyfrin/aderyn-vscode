// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
function watchAderyn() {

    const scope = document.getElementById("scope").value;
    const exclude = document.getElementById("exclude").value;

    tsvscode.postMessage({
        type: 'watch',
        value: {
            scope,
            exclude
        },
    });
}

const button = document.getElementById("watchBtn");
button.addEventListener("click", watchAderyn);