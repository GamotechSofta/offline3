import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db_Connection.js';
import marketRoutes from './routes/market/marketRoutes.js';
import adminRoutes from './routes/admin/adminRoutes.js';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3010;

connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/api/v1/markets', marketRoutes);
app.use('/api/v1/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
