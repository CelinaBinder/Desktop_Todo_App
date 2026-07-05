const params = new URLSearchParams(window.location.search);
const targetX = params.get('targetX') || '800';
const topPos = params.get('topPos') || '60';
const carColor = params.get('carColor') ? decodeURIComponent(params.get('carColor')) : '#3a5bd9';

document.documentElement.style.setProperty('--target-x', `${targetX}px`);
document.documentElement.style.setProperty('--top-pos', `${topPos}px`);
document.documentElement.style.setProperty('--car-color', carColor);
document.documentElement.style.setProperty('--accent-color', carColor);

const rigWrapper = document.getElementById('rigWrapper');

// Start the drive-in on the next frame so the CSS variables above are applied first.
requestAnimationFrame(() => {
  rigWrapper.classList.add('drive-in');
});

rigWrapper.addEventListener('animationend', (e) => {
  if (e.animationName === 'driveIn') {
    // Cat has arrived and "dropped off" the list — now drive off-screen.
    rigWrapper.classList.add('detach');
  } else if (e.animationName === 'driveOff') {
    // Car is gone — hand off to the real widget window.
    window.api.animationDone();
  }
});

// Safety fallback in case an animationend event doesn't fire for some reason.
setTimeout(() => {
  window.api.animationDone();
}, 4500);
