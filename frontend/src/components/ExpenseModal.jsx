import { useState, useEffect } from 'react';
import { createExpense, getCategories, getAllMembers } from '../api';
import { useAuth } from '../context/AuthContext';

function ExpenseModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [isPlanned, setIsPlanned] = useState(false);
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
      if (res.data.length > 0) setCategoryId(res.data[0].id);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
    }
  };

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
      await loadCategories();
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
      expense_date: expenseDate,
      category_id: parseInt(categoryId),
      is_planned: isPlanned ? 1 : 0
    };
    
    if (isAdmin && memberId) {
      data.member_id = parseInt(memberId);
    }
    
    try {
      await createExpense(data);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка добавления расхода');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Добавить расход</h3>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
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
              className="form-input w-100" 
              required 
            />
          </div>
          
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Дата</label>
            <input 
              type="date" 
              value={expenseDate} 
              onChange={(e) => setExpenseDate(e.target.value)} 
              className="form-input w-100" 
              required 
            />
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Категория расхода</label>
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)} 
              className="form-input w-100"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label className="form-checkbox">
              <input type="checkbox" checked={isPlanned} 
              onChange={(e) => setIsPlanned(e.target.checked)} />
              Плановый расход (не списывается сразу)
            </label>
          </div>
          
          <div className="modal-buttons">
            <button type="button" onClick={onClose} 
              className="btn btn-secondary">Отмена
            </button>
            <button type="submit" disabled={loading} className="btn btn-danger">
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseModal;