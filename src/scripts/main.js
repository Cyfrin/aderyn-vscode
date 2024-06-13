document.addEventListener("DOMContentLoaded", function () {
  const vscode = acquireVsCodeApi(); // Ensure this is called inside the DOMContentLoaded event
  console.log('main.js loaded'); // Confirm script is loaded

  const watchBtn = document.getElementById('watchBtn');
  if (watchBtn) {
    watchBtn.addEventListener('click', () => {
      const src = document.getElementById('src').value;
      const includes = document.getElementById('path-includes').value;
      const excludes = document.getElementById('path-excludes').value;
      console.log('Button clicked:', src, includes, excludes); // Log button click event
      vscode.postMessage({
        type: 'watch',
        value: { src, includes, excludes }
      });
    });
  } else {
    console.error('watchBtn not found');
  }
});
