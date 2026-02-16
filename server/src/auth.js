let clerkVerifyToken = null;

async function loadClerk() {
  if (!process.env.CLERK_SECRET_KEY) return null;
  try {
    const clerk = await import('@clerk/backend');
    return clerk.verifyToken;
  } catch {
    console.warn('Clerk backend not available');
    return null;
  }
}

export async function verifyToken(token) {
  if (!token) return null;
  if (!process.env.CLERK_SECRET_KEY) return null;

  if (!clerkVerifyToken) {
    clerkVerifyToken = await loadClerk();
  }
  if (!clerkVerifyToken) return null;

  try {
    const payload = await clerkVerifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return payload;
  } catch (err) {
    console.warn('Token verification failed:', err.message);
    return null;
  }
}
