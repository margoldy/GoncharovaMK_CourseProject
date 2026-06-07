import { useState, useEffect } from 'react';
import { getAllMembers, approveMember, rejectMember, 
  deleteMember, updateMemberRole } from '../api';
import { useAuth } from '../context/AuthContext';
import CreateMemberModal from '../components/CreateMemberModal';
import ImportMembersModal from '../components/ImportMembersModal';

function Members() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // загрузка данных
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await getAllMembers();
        // сначала pending, потом остальные
        const sorted = res.data.sort((a, b) => {
          if (a.role === 'pending' && b.role !== 'pending') return -1;
          if (a.role !== 'pending' && b.role === 'pending') return 1;
          return 0;
        });
        setMembers(sorted);
      } catch {
        setError('Ошибка загрузки');
      }
    };
    fetchMembers();
  }, []);

  const refreshMembers = async () => {
    try {
      const res = await getAllMembers();
      const sorted = res.data.sort((a, b) => {
        if (a.role === 'pending' && b.role !== 'pending') return -1;
        if (a.role !== 'pending' && b.role === 'pending') return 1;
        return 0;
      });
      setMembers(sorted);
    } catch {
      setError('Ошибка загрузки');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveMember(id);
      setSuccess('Пользователь подтверждён');
      await refreshMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Ошибка подтверждения');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Отклонить заявку?')) return;
    try {
      await rejectMember(id);
      setSuccess('Заявка отклонена');
      await refreshMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Ошибка отклонения');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await deleteMember(id);
      setSuccess('Пользователь удалён');
      await refreshMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Ошибка удаления');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleMakeAdmin = async (id) => {
  if (!window.confirm('Назначить пользователя администратором?')) return;
  try {
    console.log('Назначение админом, id:', id);
    const response = await updateMemberRole(id, 'admin');
    console.log('Ответ:', response);
    setSuccess('Пользователь назначен администратором');
    await refreshMembers();
    setTimeout(() => setSuccess(''), 3000);
  } catch (err) {
    console.error('Ошибка:', err);
    console.error('Ответ сервера:', err.response);
    setError(err.response?.data?.error || 'Ошибка назначения');
    setTimeout(() => setError(''), 3000);
  }
};

const handleMakeUser = async (id) => {
  if (!window.confirm('Понизить администратора до обычного пользователя?')) return;
  try {
    console.log('Понижение до пользователя, id:', id);
    const response = await updateMemberRole(id, 'user');
    console.log('Ответ:', response);
    setSuccess('Администратор понижен до пользователя');
    await refreshMembers();
    setTimeout(() => setSuccess(''), 3000);
  } catch (err) {
    console.error('Ошибка:', err);
    console.error('Ответ сервера:', err.response);
    setError(err.response?.data?.error || 'Ошибка понижения');
    setTimeout(() => setError(''), 3000);
  }
};

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Администратор';
      case 'user': return 'Пользователь';
      case 'pending': return 'Ожидает подтверждения';
      default: return role;
    }
  };

  return (
    <div>
      <h2 className="page-title">Члены семьи</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {/* Кнопки только для админа */}
      {isAdmin && (
        <div className="button-group">
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Создать пользователя
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn btn-info" style={{ backgroundColor: '#3498db', color: 'white' }}>
            Импорт из JSON
          </button>
        </div>
      )}
      
      {members.length === 0 ? (
        <div className="empty-state">Нет членов семьи</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Логин</th>
              <th>ФИО</th>
              <th>Родство</th>
              <th>Роль</th>
              {isAdmin && <th>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td>{m.login}</td>
                <td>{m.full_name}</td>
                <td>{m.relation || '—'}</td>
                <td>{getRoleLabel(m.role)}</td>
                {isAdmin && (
                  <td>
                    {/* Для ожидающих подтверждения */}
                    {m.role === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApprove(m.id)} 
                          className="btn btn-success" 
                          style={{ padding: '4px 8px', marginRight: 5 }}
                        >
                          Принять
                        </button>
                        <button 
                          onClick={() => handleReject(m.id)} 
                          className="btn btn-danger" 
                          style={{ padding: '4px 8px' }}
                        >
                          Отклонить
                        </button>
                      </>
                    )}
                    
                    {/* Для обычных пользователей - повысить или удалить */}
                    {m.role === 'user' && (
                      <>
                        <button 
                          onClick={() => handleMakeAdmin(m.id)} 
                          className="btn btn-warning" 
                          style={{ padding: '4px 8px', marginRight: 5 }}
                        >
                          Повысить
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)} 
                          className="btn btn-danger" 
                          style={{ padding: '4px 8px' }}
                        >
                          Удалить
                        </button>
                      </>
                    )}
                    
                    {/* Для админов - понизить или удалить (нельзя себя) */}
                    {m.role === 'admin' && m.id !== user?.id && (
                      <>
                        <button 
                          onClick={() => handleMakeUser(m.id)} 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', marginRight: 5 }}
                        >
                          Понизить
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)} 
                          className="btn btn-danger" 
                          style={{ padding: '4px 8px' }}
                        >
                          Удалить
                        </button>
                      </>
                    )}
                    
                    {m.role === 'admin' && m.id === user?.id && (
                      <span style={{ color: '#999' }}>Вы</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {showCreateModal && <CreateMemberModal onClose={() => setShowCreateModal(false)} onSuccess={refreshMembers} />}
      {showImportModal && <ImportMembersModal onClose={() => setShowImportModal(false)} onSuccess={refreshMembers} />}
    </div>
  );
}

export default Members;