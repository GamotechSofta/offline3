import User from '../models/user/user.js';
import bcrypt from 'bcryptjs';
import { Wallet } from '../models/wallet/wallet.js';
import { getBookieUserIds } from '../utils/bookieFilter.js';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

const addWalletBalanceToUsers = async (users) => {
    if (!users || users.length === 0) return users;
    const userIds = users.map((u) => u._id);
    const wallets = await Wallet.find({ userId: { $in: userIds } }).select('userId balance').lean();
    const walletMap = Object.fromEntries(wallets.map((w) => [String(w.userId), w.balance ?? 0]));
    return users.map((u) => ({ ...u, walletBalance: walletMap[String(u._id)] ?? 0 }));
};

const addOnlineStatus = (users) => {
    const now = Date.now();
    return users.map((u) => {
        const lastActive = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
        const isOnline = lastActive > 0 && now - lastActive < ONLINE_THRESHOLD_MS;
        return { ...u, isOnline };
    });
};

export const userLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
            });
        }

        const user = await User.findOne({ username, isActive: true });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        await User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } });

        // Get wallet balance
        const wallet = await Wallet.findOne({ userId: user._id });
        const balance = wallet ? wallet.balance : 0;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                balance: balance,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const userHeartbeat = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }
        await User.updateOne({ _id: userId }, { $set: { lastActiveAt: new Date() } });
        res.status(200).json({ success: true, message: 'Heartbeat updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const userSignup = async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email and password are required',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email: email.toLowerCase() }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username or email already exists',
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Direct frontend signup: referredBy = null → super_admin's user. Via bookie link: referredBy = bookie ID → bookie's user.
        const referredBy = req.body.referredBy || null;
        const source = referredBy ? 'bookie' : 'super_admin';
        const now = new Date();
        const userDoc = {
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone: phone || '',
            role: 'user',
            balance: 0,
            isActive: true,
            source,
            referredBy,
            lastActiveAt: now,
            createdAt: now,
            updatedAt: now,
        };

        const user = await User.collection.insertOne(userDoc);
        const userId = user.insertedId;

        // Create wallet for user
        await Wallet.collection.insertOne({
            userId,
            balance: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: userId,
                username: userDoc.username,
                email: userDoc.email,
                role: userDoc.role,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'User with this username or email already exists',
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createUser = async (req, res) => {
    try {
        const { username, email, password, phone, role, balance, referredBy } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email and password are required',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
        }

        // Super admin creates → source=super_admin, referredBy=null. Bookie creates → source=bookie, referredBy=bookie_id.
        let finalReferredBy = referredBy;
        let source = 'super_admin';
        if (req.admin && req.admin.role === 'bookie') {
            finalReferredBy = req.admin._id;
            source = 'bookie';
        }

        // Hash password manually to avoid pre-save hook issues
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user directly in collection to bypass pre-save hook
        const userDoc = {
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone: phone || '',
            role: role || 'user',
            balance: balance || 0,
            isActive: true,
            source,
            referredBy: finalReferredBy || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const user = await User.collection.insertOne(userDoc);
        const userId = user.insertedId;

        // Create wallet for user
        await Wallet.collection.insertOne({
            userId,
            balance: balance || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: userId,
                username: userDoc.username,
                email: userDoc.email,
                role: userDoc.role,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'User with this username or email already exists',
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get users with optional filter.
 * filter=all (default): all users; super_admin sees all, bookie sees only their users.
 * filter=super_admin: users where source=super_admin or (referredBy=null) - super admin's users only.
 * filter=bookie: users where source=bookie or (referredBy!=null) - bookie's users; sorted by bookie username then createdAt.
 */
export const getUsers = async (req, res) => {
    try {
        const { filter = 'all' } = req.query;
        const bookieUserIds = await getBookieUserIds(req.admin);
        const query = {};

        if (bookieUserIds !== null) {
            query._id = { $in: bookieUserIds };
        }

        if (filter === 'super_admin') {
            query.$or = [{ referredBy: null }, { referredBy: { $exists: false } }];
        } else if (filter === 'bookie') {
            query.referredBy = { $ne: null, $exists: true };
        }

        let users = await User.find(query)
            .select('username email phone role isActive source referredBy lastActiveAt createdAt')
            .populate('referredBy', 'username')
            .sort(filter === 'bookie' ? { referredBy: 1, createdAt: -1 } : { createdAt: -1 })
            .limit(500)
            .lean();

        if (filter === 'bookie' && users.length > 0) {
            users.sort((a, b) => {
                const bookieA = a.referredBy?.username || '';
                const bookieB = b.referredBy?.username || '';
                if (bookieA !== bookieB) return bookieA.localeCompare(bookieB);
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        }

        users = await addWalletBalanceToUsers(users);
        users = addOnlineStatus(users);

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
