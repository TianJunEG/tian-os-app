import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// Kiosk attempt tokens authorise an UNAUTHENTICATED iPad to drive exactly one
// student's diagnostic attempt. They are short-lived and bound to
// {diagnosticSessionId, studentId, classDiagSessionId} so a token can't be reused
// for another student or session. getSignedToken() in auth.js only signs
// {id, role}, so we mint directly with the same secret and mirror its rotation.
const KIOSK_TTL = process.env.KIOSK_ATTEMPT_TTL || '90m';

export function mintAttemptToken({ diagnosticSessionId, studentId, classDiagSessionId }) {
  const jti = randomUUID();
  const token = jwt.sign(
    {
      kiosk: true,
      sid: String(diagnosticSessionId),
      stu: String(studentId),
      cds: String(classDiagSessionId),
      jti,
    },
    process.env.JWT_SECRET,
    { expiresIn: KIOSK_TTL },
  );
  return { token, jti };
}

// Verify against current then previous secret — same rotation as auth.js.
function verifyKioskToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (process.env.JWT_SECRET_PREVIOUS && err.name === 'JsonWebTokenError') {
      return jwt.verify(token, process.env.JWT_SECRET_PREVIOUS);
    }
    throw err;
  }
}

// Express middleware for the kiosk answer/finish routes. Puts {sid, stu, cds, jti}
// on req.kiosk. Does NOT touch req.user / workspace headers.
export function requireAttemptToken(req, res, next) {
  const token = req.headers['x-attempt-token'];
  if (!token) return res.status(401).json({ error: 'Missing attempt token' });
  let decoded;
  try {
    decoded = verifyKioskToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired attempt token' });
  }
  if (!decoded || decoded.kiosk !== true) {
    return res.status(401).json({ error: 'Not a kiosk token' });
  }
  req.kiosk = decoded;
  return next();
}

export const __test__ = { verifyKioskToken };
