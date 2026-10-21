import { COFFEES } from './data/coffees.js';
import { renderBrewLog } from './brewlog.js';

renderBrewLog(document.getElementById('brewlog'), COFFEES);
