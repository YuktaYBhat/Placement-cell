
# 🔍 SIGNUP/LOGIN BUG HUNTING - 5 MINUTE FIX GUIDE

## ⚡ QUICK START

### STEP 1: Check Database State
Run this command to see what's actually stored:
```bash
npx ts-node check-db.ts
```

**What to look for:**
- ✅ Password should be bcrypt hash: `$2a$10$X8QvQK3...` (60+ chars)
- ❌ Red flag: Plain text password or `[object Promise]`
- ❌ Red flag: Password is NULL/empty

---

## 📊 RUN THE TEST

### Option A: Quick Test (Recommended)
```bash
# 1. Start dev server
npm run dev

# 2. In new terminal, watch logs
npx ts-node -w check-db.ts
# or
npx prisma studio
```

### Option B: Manual Test
1. Go to http://localhost:3000/signup
2. Create account with:
   - Email: `test@example.com`
   - Password: `TestPassword123`
3. Check email and verify
4. Try to login with same credentials

---

## 🐛 DIAGNOSIS CHECKLIST

### Issue 1: No Users in Database
```
Result: 0 users found
Cause: Signup route not working at all
Fix: Check API network tab → POST /api/auth/register
```

### Issue 2: Password is Plain Text
```
Result: Password field contains "TestPassword123" (not $2a$...)
Cause: bcrypt.hash() call is broken
Root causes:
  ❌ Missing 'await': password: bcrypt.hash(password, 10)
  ❌ Password saved before hash: password: password
  ❌ Hash function failed silently
Fix: See STEP 2 below
```

### Issue 3: Password is [object Promise]
```
Result: Password field shows "[object Promise]"
Cause: Bcrypt.hash returns Promise, but await is missing
Fix: MUST add await:
  const hashedPassword = await bcrypt.hash(password, 12)
```

### Issue 4: Email Mismatch
```
Result: Database has "Test@Example.Com", login uses "test@example.com"
Cause: Signup normalizes, but login doesn't (or vice versa)
Fix: Both must normalize:
  const normalized = email.toLowerCase().trim()
```

### Issue 5: bcrypt.compare Always Returns False
```
Result: Password is $2a$... but login fails
Cause: Hash is corrupted or stored incorrectly
Fix: Password must be stored EXACTLY as returned by bcrypt.hash()
```

---

## ✅ VERIFICATION CHECKLIST

Run through this in order:

```
[ ] 1. Database has users with passwords
[ ] 2. Passwords start with $2a$ or $2b$ (bcrypt format)
[ ] 3. Passwords are exactly 60+ characters long
[ ] 4. Email in DB matches normalized input (lowercase, trimmed)
[ ] 5. emailVerified is set to a date (not null)
[ ] 6. Password is NOT plain text
[ ] 7. Signup and login both normalize email the same way
[ ] 8. bcrypt.hash has 'await'
[ ] 9. bcrypt.compare is used in login (not === comparison)
[ ] 10. No [object Promise] in password field
```

---

## 🚀 LOGS TO WATCH

When testing, watch server logs for:

### Signup Logs:
```
📝 SIGNUP DEBUG: { emailNormalized: '...', passwordLength: 8 }
🔐 PASSWORD HASHING DEBUG: { hashedPasswordStart: '$2a$...', isBcryptHash: true }
✅ USER CREATED: { hasPassword: true, passwordStoredLength: 60 }
```

### Login Logs:
```
🔍 LOGIN ATTEMPT: { normalizedEmail: '...', userFound: true }
🔐 PASSWORD COMPARISON: { bcryptCompareResult: true }
✅ PASSWORD VALID - Checking email verification
✅ LOGIN SUCCESS
```

### Error Logs (Red Flags):
```
❌ SIGNUP VALIDATION FAILED: { name, email, password }
❌ PASSWORD HASHING ERROR
❌ USER CREATION ERROR
❌ LOGIN FAILED: User not found or no password
❌ LOGIN FAILED: Invalid password for email
⚠️ LOGIN BLOCKED: Email not verified
```

---

## 🔧 CODE VERIFICATION

### SIGNUP - /app/api/auth/register/route.ts
✅ Must have:
```typescript
const hashedPassword = await bcrypt.hash(password, 12)  // Has 'await'!
const normalizedEmail = email.toLowerCase().trim()      // Normalized
password: hashedPassword  // NOT the plain password
```

### LOGIN - /lib/auth.ts
✅ Must have:
```typescript
const normalized = email.toLowerCase().trim()           // Same normalization
const isPasswordValid = await bcrypt.compare(
  password,
  user.password                                          // Uses bcrypt, not ===
)
if (!isPasswordValid) return null                        // Returns null, not error
```

---

## 💾 NUCLEAR OPTION: Reset & Test

If stuck, start fresh:

```bash
# 1. Delete test user from DB
npx prisma studio
# Find test user, delete it

# 2. Clear browser cookies
# Dev tools → Application → Cookies → Delete all

# 3. Try signup again
# Watch logs carefully

# 4. Run diagnostic
npx ts-node check-db.ts
```

---

## 📞 DEBUGGING FLOW

```
User Signs Up
    ↓
[Signup Logs Show?]
  ├─ No logs → API route not being called
  └─ Yes logs → Continue

Logs Show Password Hashed?
  ├─ No ($2a$...) → Password hashing broken (STEP 2)
  ├─ [object Promise] → Missing await (STEP 2)
  └─ Yes → Continue

User Created in DB?
  ├─ No → Database/Prisma error
  └─ Yes → Continue

Email Verification Link Works?
  ├─ No → Check /api/auth/verify-email endpoint
  └─ Yes → Continue

User Tries Login
    ↓
[Login Finds User?]
  ├─ No → Email not matching (STEP 4)
  └─ Yes → Continue

Password Valid?
  ├─ No → Hashing mismatch (STEP 3)
  ├─ Yes → Email verified?
  │         ├─ No → Verify email first
  │         └─ Yes → Login succeeds ✅
```

---

## 🎯 THE 99% FI

Most common causes (in order):

1. **Missing `await`** on bcrypt.hash() → Password becomes [object Promise]
2. **Storing plain password** → Check signup saves `hashedPassword`, not `password`  
3. **Email not normalized** → One uses lowercase, other doesn't
4. **emailVerified is null** → User created, but blocking login
5. **bcrypt.compare always false** → Hash corrupted during storage

---

## ✗ Common Mistakes

```
❌ NOT THIS:
password: password  // Stores plain text

✅ DO THIS:
password: hashedPassword  // Stores hash

---

❌ NOT THIS:
const hashedPassword = bcrypt.hash(password, 10)  // Missing await!

✅ DO THIS:
const hashedPassword = await bcrypt.hash(password, 12)

---

❌ NOT THIS:
if (password === user.password)  // Can't compare plain & hash

✅ DO THIS:
const isValid = await bcrypt.compare(password, user.password)
```

---

Run `npx ts-node check-db.ts` now → tell me the output! 🚀
