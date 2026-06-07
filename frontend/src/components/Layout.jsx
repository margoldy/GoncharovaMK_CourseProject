import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';

function Layout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentDate = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-container">
      {/* Верхняя панель с приветствием, датой и кнопкой выхода */}
      <div className="user-bar">
        <div className="user-info">
          <span className="user-greeting">
            Рады видеть Вас, {user?.full_name || user?.login || 'пользователь'}!
          </span>
          <span className="current-date">
            Сегодня - {currentDate}
          </span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Выйти
        </button>
      </div>
      <nav className="navbar">
        <Link to="/" className="nav-link">Главная</Link>
        <Link to="/incomes" className="nav-link">Доходы</Link>
        <Link to="/expenses" className="nav-link">Расходы</Link>
        <Link to="/transfers" className="nav-link">Переводы</Link>
        <Link to="/report" className="nav-link">Отчёт</Link>
        <Link to="/members" className="nav-link">Члены семьи</Link>
      </nav>
      <div className="content">{children}</div>
      <Footer />
    </div>
  );
}

export default Layout;