import { useState } from 'react';
import { getReport } from '../api';
import { formatDate } from '../services/date';

function Report() {
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getReport(fromDate, toDate);
      setReportData(res.data);
    } catch {
      setError('Ошибка загрузки отчёта');
    } finally {
      setLoading(false);
    }
  };

  const balanceColor = reportData?.balance >= 0 ? 'report-balance-positive' : 'report-balance-negative';

  return (
    <div>
      <h2 className="page-title">Финансовый отчёт</h2>
      
      <div className="form-card">
        <div className="form-row">
          <div className="form-group">
            <label>С даты</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>По дату</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="form-input"
            />
          </div>
          <button onClick={fetchReport} className="btn btn-primary">
            Показать
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Загрузка...</div>}
      
      {reportData && !loading && (
        <div>
          <h3 className="section-title">
            Баланс семьи за период с {formatDate(fromDate)} по {formatDate(toDate)}
          </h3>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Статья</th>
                <th>Кто</th>
                <th>Сумма</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {/* Доходы */}
              <tr className="report-income-row">
                <td colSpan="4"><strong>Доход</strong></td>
              </tr>
              {reportData.rows
                .filter(row => row.type === 'Доход')
                .map((row, idx) => (
                  <tr key={`income-${idx}`}>
                    <td>{row.article}</td>
                    <td>{row.who}</td>
                    <td className="report-amount">{row.sum.toLocaleString()} ₽</td>
                    <td>{formatDate(row.date)}</td>
                  </tr>
                ))}
              
              {/* Расходы */}
              <tr className="report-expense-row">
                <td colSpan="4"><strong>Расход</strong></td>
              </tr>
              {reportData.rows
                .filter(row => row.type === 'Расход')
                .map((row, idx) => (
                  <tr key={`expense-${idx}`}>
                    <td>{row.article}</td>
                    <td className="report-who-empty">—</td>
                    <td className="report-amount">{row.sum.toLocaleString()} ₽</td>
                    <td>{formatDate(row.date)}</td>
                  </tr>
                ))}
              
              {/* Итого */}
              <tr className="report-total-row">
                <td colSpan="4"><strong>Итого</strong></td>
              </tr>
              <tr>
                <td><strong>Доход</strong></td>
                <td></td>
                <td className="report-amount"><strong>{reportData.total_income.toLocaleString()} ₽</strong></td>
                <td></td>
              </tr>
              <tr>
                <td><strong>Расход</strong></td>
                <td></td>
                <td className="report-amount"><strong>{reportData.total_expense.toLocaleString()} ₽</strong></td>
                <td></td>
              </tr>
              <tr>
                <td><strong>Баланс</strong></td>
                <td></td>
                <td className={`report-amount ${balanceColor}`}>
                  <strong>{reportData.balance.toLocaleString()} ₽</strong>
                </td>
                <td></td>
              </tr>
              {reportData.stash_balance > 0 && (
              <tr>
                <td style={{ paddingLeft: 20 }}>Из них в заначках</td>
                <td></td>
                <td className="report-amount">
                  {reportData.stash_balance.toLocaleString()} ₽
                </td>
                <td></td>
              </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Report;