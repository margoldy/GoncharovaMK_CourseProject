import { useState, useEffect } from 'react';
import { createIncome, getIncomeTypes, getAllMembers } from '../api';
import { useAuth } from '../context/AuthContext';

function IncomeModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeTypes, setIncomeTypes] = useState([]);
  const [typeId, setTypeId] = useState('');
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // блок фона
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // закрыть по эскейп
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Загрузка типов доходов
  const loadIncomeTypes = async () => {
    try {
      const res = await getIncomeTypes();
      setIncomeTypes(res.data);
      if (res.data.length > 0) setTypeId(res.data[0].id);
    } catch (err) {
      console.error('Ошибка загрузки типов доходов:', err);
    }
  };

  //список пользователей для админа
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
    await loadIncomeTypes();
    await loadMembers();
  };
  init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const data = {
      amount: parseFloat(amount),
      income_date: incomeDate,
      type_id: typeId
    };
    if (isAdmin && memberId) {
      data.member_id = parseInt(memberId);
    }
    
    try {
      await createIncome(data);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка добавления дохода');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Добавить доход</h3>
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
            <label className="form-label">Сумма</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="form-input w-100" required />
          </div>
          
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Дата</label>
            <input 
              type="date" 
              value={incomeDate} 
              onChange={(e) => setIncomeDate(e.target.value)} 
              className="form-input w-100" required />
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Тип дохода</label>
            <select 
              value={typeId} 
              onChange={(e) => setTypeId(e.target.value)} 
              className="form-input w-100"
            >
              {incomeTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="modal-buttons">
            <button 
              type="button" onClick={onClose} 
              className="btn btn-secondary"> Отмена </button>
            <button 
              type="submit" disabled={loading} 
              className="btn btn-success">
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default IncomeModal;