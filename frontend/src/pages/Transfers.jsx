import { useState, useEffect } from 'react';
import { getAllTransfers, getMyTransfers, deleteTransfer } from '../api';
import { useAuth } from '../context/AuthContext';
import TransferModal from '../components/TransferModal';

function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('my');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Названия счетов
  const accountNames = {
    1: 'Общий',
    2: 'Накопления',
    3: 'Заначка'
  };

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      let res;
      if (isAdmin && viewMode === 'all') {
        res = await getAllTransfers();
      } else {
        res = await getMyTransfers();
      }
      setTransfers(res.data);
      setCurrentPage(1);
    } catch {
      setError('Ошибка загрузки переводов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransfers();
  }, [viewMode]);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить перевод?')) return;
    try {
      await deleteTransfer(id);
      await fetchTransfers();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleSuccess = () => {
    fetchTransfers();
  };

  // Фильтрация
  const filteredTransfers = transfers.filter(t => {
    if (t.from_account_id === 4 || t.to_account_id === 4) return false;
    if (t.from_account_id === 5 || t.to_account_id === 5) return false;
    if (filterFrom && t.from_account_id !== parseInt(filterFrom)) return false;
    if (filterTo && t.to_account_id !== parseInt(filterTo)) return false;
    return true;
  });

  // Пагинация
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransfers = filteredTransfers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Сброс фильтров
  const clearFilters = () => {
    setFilterFrom('');
    setFilterTo('');
    setCurrentPage(1);
  };

  if (loading && transfers.length === 0) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="transfers-header">
        <h2 className="page-title">Переводы</h2>
        <button onClick={() => setShowTransferModal(true)} className="btn btn-primary">
          + Добавить перевод
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Панель управления */}
      <div className="transfers-controls">
        {/* Переключение для админа */}
        {isAdmin && (
          <div className="button-group">
            <button
              onClick={() => setViewMode('my')}
              className={`btn ${viewMode === 'my' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Мои переводы
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Все переводы
            </button>
          </div>
        )}

        {/* Фильтры */}
        <div className="transfers-filters">
          <select
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); setCurrentPage(1); }}
            className="form-input"
          >
            <option value="">Все счета (откуда)</option>
            <option value="1">Общий</option>
            <option value="2">Накопления</option>
            <option value="3">Заначка</option>
          </select>

          <select
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); setCurrentPage(1); }}
            className="form-input"
          >
            <option value="">Все счета (куда)</option>
            <option value="1">Общий</option>
            <option value="2">Накопления</option>
            <option value="3">Заначка</option>
          </select>

          {(filterFrom || filterTo) && (
            <button onClick={clearFilters} className="btn btn-secondary">
              Сбросить
            </button>
          )}
        </div>
      </div>

      {currentTransfers.length === 0 ? (
        <div className="empty-state">
          Нет переводов. Добавьте первый перевод через кнопку выше.
        </div>
      ) : (
        <>
          <table className="data-table transfers-table">
            <thead>
              <tr>
                <th>Дата</th>
                {isAdmin && viewMode === 'all' && <th>Пользователь</th>}
                <th>Сумма</th>
                <th>Откуда</th>
                <th>Куда</th>
                {isAdmin && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {currentTransfers.map(t => (
                <tr key={t.id}>
                  <td>{t.transfer_date}</td>
                  {isAdmin && viewMode === 'all' && (
                    <td>{t.full_name || t.login || `ID: ${t.member_id}`}</td>
                  )}
                  <td>{Number(t.amount).toLocaleString()} ₽</td>
                  <td>{accountNames[t.from_account_id] || t.from_account_id}</td>
                  <td>{accountNames[t.to_account_id] || t.to_account_id}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="btn btn-danger">
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

      {showTransferModal && (
        <TransferModal
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default Transfers;