import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, register as registerApi } from '../api'; 

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ login: '', password: '', fullName: '', relation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegister) {
        if (!form.fullName) throw new Error('ФИО обязательно');

        await registerApi({ 
          login: form.login, 
          password: form.password, 
          full_name: form.fullName, 
          relation: form.relation || null 
        });
        
        setIsRegister(false);
        setError('Регистрация успешна! Теперь дождитесь подтверждения от администратора.');
      } else {
        const res = await loginApi(form.login, form.password);
        login(res.data.token, res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Семейный бюджет</h2>
      <h3 className="login-subtitle">
        {isRegister ? 'Регистрация' : 'Вход в систему'}
      </h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="login-form-group">
          <label className="form-label">Логин</label>
          <input 
            name="login" 
            type="text" 
            value={form.login} 
            onChange={handleChange} 
            className="form-input w-100" 
            required 
          />
        </div>
        
        <div className="login-form-group">
          <label className="form-label">Пароль</label>
          <input 
            name="password" 
            type="password" 
            value={form.password} 
            onChange={handleChange} 
            className="form-input w-100" 
            required 
          />
        </div>

        {isRegister && (
          <>
            <div className="login-form-group">
              <label className="form-label">ФИО *</label>
              <input 
                name="fullName" 
                type="text" 
                value={form.fullName} 
                onChange={handleChange} 
                className="form-input w-100" 
                required 
              />
            </div>
            
            <div className="login-form-group-large">
              <label className="form-label">Родство</label>
              <input 
                name="relation" 
                type="text" 
                value={form.relation} 
                onChange={handleChange} 
                placeholder="отец, сын, святой дух..." 
                className="form-input w-100" 
              />
            </div>
          </>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary login-button"
        >
          {loading ? 'Загрузка...' : (isRegister ? 'Зарегистрироваться' : 'Войти')}
        </button>
      </form>
      
      <div className="text-center" style={{ marginTop: 15 }}>
        <button 
          onClick={() => { 
            setIsRegister(!isRegister); 
            setError(''); 
            setForm({ login: '', password: '', fullName: '', relation: '' }); 
          }} 
          className="login-toggle"
        >
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
      
      {!isRegister && (
        <div className="login-hint">
          <p>Админ: admin / admin123</p>
        </div>
      )}
    </div>
  );
}

export default Login;