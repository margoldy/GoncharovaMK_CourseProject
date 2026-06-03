require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { initDatabase } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Сервер работает' });
});

async function start() {

    await initDatabase();

    /*
    const membersRouter = require('./routes/members');
    const incomesRouter = require('./routes/incomes');
    const expensesRouter = require('./routes/expenses');
    const transfersRouter = require('./routes/transfers');
    const reportsRouter = require('./routes/reports');

    app.use('/api/members', membersRouter);
    app.use('/api/incomes', incomesRouter);
    app.use('/api/expenses', expensesRouter);
    app.use('/api/transfers', transfersRouter);
    app.use('/api/reports', reportsRouter);
    */

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    });
}

start().catch(console.error);