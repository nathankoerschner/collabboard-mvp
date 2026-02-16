import { Clerk } from '@clerk/clerk-js';

let clerk = null;

export async function initAuth() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.log('No Clerk key configured, running without auth');
    return null;
  }

  clerk = new Clerk(publishableKey);
  await clerk.load();
  return clerk;
}

export function getClerk() {
  return clerk;
}

export function isSignedIn() {
  if (!clerk) return true; // No auth = always signed in
  return !!clerk.user;
}

export function getUser() {
  if (!clerk) return { id: 'anonymous', firstName: 'Anonymous', fullName: 'Anonymous User' };
  return clerk.user;
}

export async function getToken() {
  if (!clerk?.session) return null;
  return clerk.session.getToken();
}

export function mountSignIn(el) {
  if (!clerk) return;
  clerk.mountSignIn(el);
}

export function mountUserButton(el) {
  if (!clerk) return;
  clerk.mountUserButton(el);
}

export async function signOut() {
  if (!clerk) return;
  await clerk.signOut();
}
