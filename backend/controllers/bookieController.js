import Admin from '../models/admin/admin.js';

/**
 * Bookie login - only allows users with role 'bookie' and status 'active'
 * Body: { username, password }
 */
export const bookieLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
            });
        }

        const bookie = await Admin.findOne({ username, role: 'bookie' });
        if (!bookie) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check if bookie account is active
        if (bookie.status === 'inactive') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact admin.',
            });
        }

        const isPasswordValid = await bookie.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: bookie._id,
                username: bookie.username,
                role: bookie.role,
                email: bookie.email,
                phone: bookie.phone,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get bookie's referral link - requires bookie auth via verifyAdmin
 * Returns bookieId for frontend to construct URL
 */
export const getReferralLink = async (req, res) => {
    try {
        const bookie = await Admin.findOne({ _id: req.admin._id, role: 'bookie' });
        if (!bookie) {
            return res.status(403).json({
                success: false,
                message: 'Bookie access required',
            });
        }
        res.status(200).json({
            success: true,
            data: {
                bookieId: bookie._id,
                username: bookie.username,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
