// Brew log: a table of coffees with a method filter. Text only — entries never become HTML.

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

function row(c, i) {
  const tr = el('tr');
  tr.append(el('td', 'num', String(i + 1).padStart(2, '0')));
  const bean = el('td', 'bean');
  bean.append(el('b', '', c.name), el('span', '', c.notes));
  tr.append(bean, el('td', '', c.origin), el('td', '', c.method));
  const rating = c.rating
    ? el('td', 'stars', '●'.repeat(c.rating) + '○'.repeat(5 - c.rating))
    : el('td', 'unrated', 'not rated yet');
  if (c.rating) rating.setAttribute('aria-label', `${c.rating} out of 5`);
  tr.append(rating);
  return tr;
}

export function renderBrewLog(root, coffees) {
  const methods = ['All', ...new Set(coffees.map(c => c.method))];
  let active = 'All';

  const filters = el('div', 'filters');
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Filter by method');
  filters.hidden = methods.length <= 2; // one real method: nothing to filter
  const buttons = methods.map(m => {
    const b = el('button', '', m);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(m === active));
    b.addEventListener('click', () => {
      active = m;
      buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      fill();
    });
    return b;
  });
  filters.append(...buttons);

  const table = el('table', 'log');
  const head = el('tr');
  for (const h of ['#', 'bean', 'origin', 'method', 'rating']) head.append(el('th', '', h));
  table.createTHead().append(head);
  const body = table.createTBody();

  function fill() {
    const shown = active === 'All' ? coffees : coffees.filter(c => c.method === active);
    body.replaceChildren(...shown.map(row));
    if (!shown.length) {
      const tr = el('tr'), td = el('td', 'unrated', 'No coffees with this method yet.');
      td.colSpan = 5;
      tr.append(td);
      body.append(tr);
    }
  }

  fill();
  root.replaceChildren(filters, table);
}
