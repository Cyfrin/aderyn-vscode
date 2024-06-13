document.addEventListener("DOMContentLoaded", function () {
  const vscode = acquireVsCodeApi(); // Ensure this is called inside the DOMContentLoaded event
  console.log('main.js loaded'); // Confirm script is loaded

  const watchBtn = document.getElementById('watchBtn');
  if (watchBtn) {
    watchBtn.addEventListener('click', () => {
      const scope = document.getElementById('scope').value;
      const exclude = document.getElementById('exclude').value;
      console.log('Button clicked:', scope, exclude); // Log button click event
      vscode.postMessage({
        type: 'watch',
        value: { scope, exclude }
      });
    });
  } else {
    console.error('watchBtn not found');
  }
});
