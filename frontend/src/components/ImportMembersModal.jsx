import { useState, useEffect } from 'react';
import { importMembers } from '../api';

function ImportMembersModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Пожалуйста, выберите JSON файл');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Выберите файл');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const users = JSON.parse(event.target.result);
          await importMembers(users);
          setSuccess(`Импортировано ${users.length} пользователей`);
          onSuccess();
          setTimeout(() => {
            onClose();
          }, 1500);
        } catch {
          setError('Ошибка парсинга JSON или импорта');
        }
      };
      reader.onerror = () => setError('Ошибка чтения файла');
      reader.readAsText(file);
    } catch {
      setError('Ошибка импорта');
    } finally {
      setLoading(false);
    }
  };

 return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Импорт пользователей из JSON</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Выберите JSON файл со списком пользователей</label>
            <input type="file" accept=".json" onChange={handleFileChange} className="form-input w-100" style={{ marginTop: 5 }} />
            <small className="form-small">
              Формат: массив объектов с полями login, password, full_name, relation, role
            </small>
          </div>
          
          <div className="modal-buttons">
            <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
            <button type="submit" disabled={loading || !file} className="btn btn-primary" style={{ backgroundColor: '#3498db' }}>
              {loading ? 'Импорт...' : 'Импортировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default ImportMembersModal;