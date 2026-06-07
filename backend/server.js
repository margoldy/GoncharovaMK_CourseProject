require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { initDatabase } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// -- роуты и юзы --
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const membersRoutes = require('./routes/members');
app.use('/api/members', membersRoutes);

const incomesRoutes = require('./routes/incomes');
app.use('/api/incomes', incomesRoutes);

const expensesRoutes = require('./routes/expenses');
app.use('/api/expenses', expensesRoutes);

const transfersRoutes = require('./routes/transfers');
app.use('/api/transfers', transfersRoutes);

const reportsRoutes = require('./routes/reports');
app.use('/api/reports', reportsRoutes);

const balancesRoutes = require('./routes/balances');
app.use('/api/balances', balancesRoutes);

const logsRoutes = require('./routes/logs');
app.use('/api/logs', logsRoutes);

async function start() {

    await initDatabase();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
}

start().catch(console.error);