// Which desk object opens which section, and how the detector labels it.

export const ORDER = ['work', 'coffee', 'trade', 'about', 'contact'];

export const SECTIONS = {
  work: { object: 'laptop', target: 'z-laptop', label: 'laptop', conf: '0.97', name: 'Work' },
  coffee: { object: 'v60', target: 'z-v60', label: 'v60_dripper', conf: '0.94', name: 'Coffee' },
  trade: { object: 'phone', target: 'z-phone', label: 'cell_phone', conf: '0.91', name: 'Trade' },
  about: { object: 'polaroid', target: 'z-polaroid', label: 'polaroid', conf: '0.96', name: 'About' },
  contact: { object: 'envelope', target: 'z-envelope', label: 'envelope', conf: '0.99', name: 'Contact' },
};

// detected but not navigation: hover swaps the label for a quip
export const DECOR = {
  ball: { object: 'ball', label: 'sports_ball', conf: '0.88', quip: 'weekends → basketball' },
  pick: { object: 'pick', label: 'guitar_pick', conf: '0.41', quip: 'low conf. it plays guitar' },
};

export const INTRO_KEY = 'ksx-viewfinder-intro-v1';
