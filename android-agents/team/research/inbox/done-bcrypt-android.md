# Research Request: BCrypt on Android

Requested by: api-dev
For tasks: 17005

Questions:
- What is the exact Maven coordinate and latest version for at.favre.lib:bcrypt?
- What is the correct API call to hash a PIN string: BCrypt.withDefaults().hash(cost, password.toCharArray()) — what cost factor is recommended for a PIN?
- What is the correct API call to verify a PIN against a stored hash: BCrypt.verifyer().verify(password.toCharArray(), hash) — what does the result object expose?
- Does at.favre.lib:bcrypt have any known compatibility issues with Android API 26+ or with R8/ProGuard shrinking?
- Are there any required ProGuard/R8 keep rules for the bcrypt library?
- Is there an alternative library (e.g., org.mindrot:jbcrypt) that is more commonly used on Android — and if so, what is the difference in API?
- Should bcrypt hashing be performed on a background coroutine dispatcher (Dispatchers.IO) given the intentional CPU cost?
