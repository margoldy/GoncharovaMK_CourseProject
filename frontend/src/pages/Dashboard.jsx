import { useState, useEffect } from 'react';
import { getBalances } from '../api';
import IncomeModal from '../components/IncomeModal';
import ExpenseModal from '../components/ExpenseModal';
import TransferModal from '../components/TransferModal';

function Dashboard() {
  const [balances, setBalances] = useState(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBalances = async () => {
    try {
      const res = await getBalances();
      setBalances(res.data);  // { common, savings, user_stash, total_stash }
    } catch {
      setError('Ошибка загрузки балансов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBalances();
  }, []); 

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <h2 className="page-title">Главная</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Балансы */}
      <div className="balance-grid">
        <div className="balance-card balance-card-primary">
          <h3>Общий счёт</h3>
          <p className="balance-amount">{balances?.common?.toLocaleString()} ₽</p>
        </div>
        
        <div className="balance-card balance-card-info">
          <h3>Накопления</h3>
          <p className="balance-amount">{balances?.savings?.toLocaleString()} ₽</p>
        </div>
        
        <div className="balance-card balance-card-warning">
          <h3>Ваша заначка</h3>
          <p className="balance-amount">{balances?.user_stash?.toLocaleString() || 0} ₽</p>
          
        </div>
      </div>
      
      {/* Кнопки действий */}
      <div className="button-group">
        <button onClick={() => setShowIncomeModal(true)} className="btn btn-success">
          Добавить доход
        </button>
        <button onClick={() => setShowExpenseModal(true)} className="btn btn-danger">
          Добавить расход
        </button>
        <button onClick={() => setShowTransferModal(true)} className="btn btn-primary">
          Перевод между счетами
        </button>
      </div>
      
      {/* Модальные окна */}
      {showIncomeModal && <IncomeModal onClose={() => setShowIncomeModal(false)} onSuccess={fetchBalances} />}
      {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} onSuccess={fetchBalances} />}
      {showTransferModal && <TransferModal onClose={() => setShowTransferModal(false)} onSuccess={fetchBalances} />}
    </div>
  );
}

export default Dashboard;