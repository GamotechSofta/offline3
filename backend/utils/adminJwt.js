import jwt from 'jsonwebtoken';

const SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin-jwt-secret-change-in-production';
const EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '7d';

/**
 * Sign a JWT for admin (after login). Payload: { id, username, role }.
 */
export function signAdminToken(admin) {
    return jwt.sign(
        { id: admin._id.toString(), username: admin.username, role: admin.role },
        SECRET,
        { expiresIn: EXPIRES_IN }
    );
}

/**
 * Verify admin JWT. Returns payload or throws.
 */
export function verifyAdminToken(token) {
    return jwt.verify(token, SECRET);
}
