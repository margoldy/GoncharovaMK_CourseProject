import { useState, useEffect } from 'react';
import { createMember } from '../api';

function CreateMemberModal({ onClose, onSuccess }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [relation, setRelation] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await createMember({ login, password, full_name: fullName, relation, role });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Создать пользователя</h3>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Логин *</label>
            <input type="text" value={login} 
            onChange={(e) => setLogin(e.target.value)} 
            className="form-input w-100" required />
          </div>
          
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Пароль *</label>
            <input type="password" value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="form-input w-100" required />
          </div>
          
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">ФИО *</label>
            <input type="text" value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            className="form-input w-100" required />
          </div>
          
          <div style={{ marginBottom: 15 }}>
            <label className="form-label">Родство</label>
            <input type="text" value={relation} 
            onChange={(e) => setRelation(e.target.value)} 
            placeholder="отец, сын, святой дух..." 
            className="form-input w-100" />
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Роль</label>
            <select value={role} 
            onChange={(e) => setRole(e.target.value)} 
            className="form-input w-100">
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          
          <div className="modal-buttons">
            <button type="button" 
            onClick={onClose} 
            className="btn btn-secondary">Отмена</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Создание...' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateMemberModal;