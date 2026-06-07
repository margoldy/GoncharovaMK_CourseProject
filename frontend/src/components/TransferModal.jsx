import { useState, useEffect } from 'react';
import { createTransfer, getAllMembers } from '../api';
import { useAuth } from '../context/AuthContext';

function TransferModal({ onClose, onSuccess }) {
  const [fromAccountId, setFromAccountId] = useState(3); // по умолчанию заначка
  const [toAccountId, setToAccountId] = useState(1); // по умолчанию общий
  const [amount, setAmount] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // блок фона при открытии
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // закрытие по escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const loadMembers = async () => {
    if (!isAdmin) return;
    try {
      const res = await getAllMembers();
      setMembers(res.data);
      if (res.data.length > 0) setMemberId(res.data[0].id);
    } catch (err) {
      console.error('Ошибка загрузки членов семьи:', err);
    }
  };

 useEffect(() => {
  const init = async () => {
    await loadMembers();
  };
  init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (fromAccountId === toAccountId) {
      setError('Нельзя перевести на тот же счёт');
      return;
    }
    setLoading(true);

    const data = {
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount: parseFloat(amount),
      transfer_date: transferDate
    };

    if (isAdmin && memberId) {
      data.member_id = parseInt(memberId);
    }
    try {
      await createTransfer(data);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка перевода');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableAccounts = () => {
    if (isAdmin) {
      return [
        { id: 1, name: 'Общий счёт' },
        { id: 2, name: 'Накопления' },
        { id: 3, name: 'Заначка' }
      ];
    }
    return [
      { id: 3, name: 'Заначка' }
    ];
  };

  const availableFromAccounts = getAvailableAccounts();
  const availableToAccounts = [
    { id: 1, name: 'Общий счёт' },
    { id: 2, name: 'Накопления' },
    { id: 3, name: 'Заначка' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Перевод между счетами</h3>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* Для админа — выбор пользователя */}
          {isAdmin && members.length > 0 && (
            <div style={{ marginBottom: 15 }}>
              <label className="form-label">Пользователь</label>
              <select 
                value={memberId} 
                onChange={(e) => setMemberId(e.target.value)} 
                className="form-input w-100"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.login} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">С какого счёта</label>
            <select 
              value={fromAccountId} 
              onChange={(e) => setFromAccountId(Number(e.target.value))} 
              className="form-input w-100"
            >
              {availableFromAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            {!isAdmin && (
              <small className="form-small" style={{ color: 'var(--warning)' }}>
                Вы можете переводить только с заначки
              </small>
            )}
          </div>
          
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">На какой счёт</label>
            <select 
              value={toAccountId} 
              onChange={(e) => setToAccountId(Number(e.target.value))} 
              className="form-input w-100"
            >
              {availableToAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Сумма</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="form-input w-100" 
              required 
            />
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Дата</label>
            <input 
              type="date" 
              value={transferDate} 
              onChange={(e) => setTransferDate(e.target.value)} 
              className="form-input w-100" 
              required 
            />
          </div>
          
          <div className="modal-buttons">
            <button type="button" onClick={onClose} 
              className="btn btn-secondary"> Отмена
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Перевод...' : 'Перевести'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default TransferModal;