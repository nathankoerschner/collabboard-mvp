import { landingView } from './views/landing.js';
import { dashboardView } from './views/dashboard.js';
import { boardView } from './views/board.js';
import { isSignedIn } from './auth.js';

const routes = [
  { pattern: /^#\/board\/(.+)$/, view: boardView, params: m => ({ boardId: m[1] }), requiresAuth: true },
  { pattern: /^#\/dashboard$/, view: dashboardView, params: () => ({}), requiresAuth: true },
  { pattern: /.*/, view: landingView, params: () => ({}) },
];

let currentView = null;
let container = null;

function resolve() {
  const hash = location.hash || '#/';
  for (const route of routes) {
    const match = hash.match(route.pattern);
    if (match) {
      // Auth guard
      if (route.requiresAuth && !isSignedIn()) {
        return { view: landingView, params: {} };
      }
      return { view: route.view, params: route.params(match) };
    }
  }
  return { view: landingView, params: {} };
}

function navigate() {
  if (currentView?.destroy) {
    currentView.destroy();
  }
  const { view, params } = resolve();
  currentView = view;
  container.innerHTML = '';
  view.render(container, params);
}

export const router = {
  start(el) {
    container = el;
    window.addEventListener('hashchange', navigate);
    navigate();
  },
};

export function navigateTo(path) {
  location.hash = path;
}
