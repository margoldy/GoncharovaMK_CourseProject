import { useState, useEffect } from 'react';
import { getMyExpenses, getAllExpenses, 
  deleteExpense, executePlannedExpense } from '../api';
import { useAuth } from '../context/AuthContext';
import ExpenseModal from '../components/ExpenseModal';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('my');
  const [filterPlanned, setFilterPlanned] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (isAdmin && viewMode === 'all') {
        res = await getAllExpenses();
      } else {
        res = await getMyExpenses();
      }
      setExpenses(res.data);
      setCurrentPage(1);
    } catch {
      setError('Ошибка загрузки расходов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses();
  }, [viewMode]);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить расход? Будут также удалены связанные переводы')) return;
    try {
      await deleteExpense(id);
      await fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleExecutePlanned = async (id) => {
    setError(''); 
    try {
      await executePlannedExpense(id);
      await fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка выполнения планового расхода');
    }
  };

  const handleSuccess = () => {
    fetchExpenses();
  };

  const filteredExpenses = filterPlanned 
    ? expenses.filter(exp => exp.is_planned === 1)
    : expenses;

  // Пагинация
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (loading && expenses.length === 0) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="expenses-header">
        <h2 className="page-title">Расходы</h2>
        <button onClick={() => setShowExpenseModal(true)} className="btn btn-danger">
          + Добавить расход
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="expenses-controls">
        {isAdmin && (
          <div className="button-group">
            <button 
              onClick={() => setViewMode('my')} 
              className={`btn ${viewMode === 'my' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Мои расходы
            </button>
            <button 
              onClick={() => setViewMode('all')} 
              className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Все расходы
            </button>
          </div>
        )}
        
        <label className="form-checkbox expenses-filter">
          <input 
            type="checkbox" 
            checked={filterPlanned} 
            onChange={(e) => {
              setFilterPlanned(e.target.checked);
              setCurrentPage(1);
            }} 
          />
          Показать только плановые расходы
        </label>
      </div>
      
      {currentExpenses.length === 0 ? (
        <div className="empty-state">
          Нет расходов. Добавьте новый расход через кнопку выше.
        </div>
      ) : (
        <>
          <table className="data-table expenses-table">
            <thead>
              <tr>
                <th>Дата</th>
                {isAdmin && viewMode === 'all' && <th>Пользователь</th>}
                <th>Сумма</th>
                <th>Категория</th>
                <th>Выполнен</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {currentExpenses.map(exp => (
                <tr key={exp.id}>
                  <td>{exp.expense_date}</td>
                  {isAdmin && viewMode === 'all' && (
                    <td>{exp.full_name || exp.login || `ID: ${exp.member_id}`}</td>
                  )}
                  <td>{Number(exp.amount).toLocaleString()} ₽</td>
                  <td>{exp.category_name || '—'}</td>
                  <td>{exp.is_planned ? 'Нет' : 'Да'}</td>
                  <td>
                    {exp.is_planned === 1 && (
                      <button 
                        onClick={() => handleExecutePlanned(exp.id)} 
                        className="btn btn-warning"
                      >
                        Выполнить
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(exp.id)} 
                      className="btn btn-danger"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={prevPage} disabled={currentPage === 1}>
                ← Назад
              </button>
              <span>
                Страница {currentPage} из {totalPages}
              </span>
              <button onClick={nextPage} disabled={currentPage === totalPages}>
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
      
      {showExpenseModal && (
        <ExpenseModal 
          onClose={() => setShowExpenseModal(false)} 
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default Expenses;