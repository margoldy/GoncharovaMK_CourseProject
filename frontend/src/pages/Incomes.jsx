import { useState, useEffect, useCallback } from 'react';
import { getMyIncomes, getAllIncomes, deleteIncome, getIncomeTypes } from '../api';
import { useAuth } from '../context/AuthContext';
import IncomeModal from '../components/IncomeModal';

function Incomes() {
  const [incomes, setIncomes] = useState([]);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('my');
  const [incomeTypes, setIncomeTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const loadIncomeTypes = useCallback(async () => {
    try {
      const res = await getIncomeTypes();
      const typesMap = {};
      res.data.forEach(type => {
        typesMap[type.id] = type.name;
      });
      setIncomeTypes(typesMap);
    } catch (err) {
      console.error('Ошибка загрузки типов доходов:', err);
    }
  }, []);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (isAdmin && viewMode === 'all') {
        res = await getAllIncomes();
      } else {
        res = await getMyIncomes();
      }
      setIncomes(res.data);
      setCurrentPage(1);
    } catch {
      setError('Ошибка загрузки доходов');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, viewMode]);

  useEffect(() => {
  const init = async () => {
    await loadIncomeTypes();
  };
  init();
  }, [loadIncomeTypes]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchIncomes();
    };
    fetchData();
  }, [fetchIncomes]);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить доход? Будут также удалены все связанные переводы')) return;
    
    try {
      await deleteIncome(id);
      fetchIncomes();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleSuccess = () => {
    fetchIncomes();
  };

  const getTypeName = (typeId) => {
    return incomeTypes[typeId] || 'Доход';
  };

  // Пагинация
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentIncomes = incomes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(incomes.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (loading && incomes.length === 0) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="incomes-header">
        <h2 className="page-title">Доходы</h2>
        <button onClick={() => setShowIncomeModal(true)} className="btn btn-success">
          + Добавить доход
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {isAdmin && (
        <div className="button-group incomes-controls">
          <button 
            onClick={() => setViewMode('my')} 
            className={`btn ${viewMode === 'my' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Мои доходы
          </button>
          <button 
            onClick={() => setViewMode('all')} 
            className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Все доходы
          </button>
        </div>
      )}
      
      {incomes.length === 0 ? (
        <div className="empty-state">
          Нет доходов. Добавьте первый доход через кнопку выше.
        </div>
      ) : (
        <>
          <table className="data-table incomes-table">
            <thead>
              <tr>
                <th>Дата</th>
                {isAdmin && viewMode === 'all' && <th>Пользователь</th>}
                <th>Сумма</th>
                <th>Категория</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {currentIncomes.map(inc => (
                <tr key={inc.id}>
                  <td>{inc.income_date}</td>
                  {isAdmin && viewMode === 'all' && (
                    <td>{inc.full_name || inc.login || `ID: ${inc.member_id}`}</td>
                  )}
                  <td>{Number(inc.amount).toLocaleString()} ₽</td>
                  <td>{getTypeName(inc.type_id)}</td>
                  <td>
                    <button 
                      onClick={() => handleDelete(inc.id)} 
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
      
      {showIncomeModal && (
        <IncomeModal 
          onClose={() => setShowIncomeModal(false)} 
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default Incomes;