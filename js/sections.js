// Section overlays in camera mode, plus the bar under them (back + chips).

export function createSections(root, { onBack, onJump }) {
  const html = document.documentElement;
  const bar = document.querySelector('.secbar');
  const chips = [...bar.querySelectorAll('.chip')];
  let current = null;

  bar.querySelector('.back').addEventListener('click', onBack);
  chips.forEach(c => c.addEventListener('click', () => onJump(c.dataset.k)));

  return {
    show(key, ms) {
      const el = document.getElementById(key);
      current = key;
      html.dataset.section = key;
      el.style.transitionDuration = ms + 'ms';
      el.classList.add('is-open');
      el.scrollTop = 0;
      requestAnimationFrame(() => el.classList.add('is-visible')); // next frame, so the fade runs
      chips.forEach(c => {
        const on = c.dataset.k === key;
        c.classList.toggle('on', on);
        c.setAttribute('aria-current', String(on));
      });
      bar.classList.add('on');
      document.getElementById(key + '-h').focus({ preventScroll: true });
    },
    hide(key, ms) {
      const el = document.getElementById(key);
      el.style.transitionDuration = ms + 'ms';
      el.classList.remove('is-visible');
      if (current === key) {
        current = null;
        delete html.dataset.section;
        bar.classList.remove('on');
      }
      return new Promise(resolve => setTimeout(() => {
        if (current !== key) el.classList.remove('is-open');
        resolve();
      }, ms));
    },
    current: () => current,
  };
}
