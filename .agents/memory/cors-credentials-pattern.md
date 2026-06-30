---
name: CORS with credentials safe pattern
description: Using origin:true with credentials:true reflects any origin and allows cross-site authenticated reads — high-risk pattern to avoid.
---

## Rule
Never use `cors({ origin: true, credentials: true })`. This reflects any request origin while allowing credential-bearing requests, enabling cross-site authenticated API reads.

**Why:** Browsers normally block credentialed cross-origin reads, but `origin: true` in cors() causes the server to reflect back whatever `Origin` header it receives, making the CORS check meaningless.

**Safe pattern:**
```typescript
cors({
  credentials: true,
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server OK
    if (process.env.NODE_ENV !== 'production' && origin.endsWith('.replit.dev')) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
})
```

**How to apply:** Any Express app using Clerk session cookies (credentials:true) must use an explicit origin allowlist.
