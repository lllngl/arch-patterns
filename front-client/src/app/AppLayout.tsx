import { Link, Outlet } from 'react-router-dom';

export const AppLayout = () => {
  return (
    <div className="app-layout">
      <header className="bg-blue-600 text-white p-4">
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:underline">Главная</Link></li>
            <li><Link to="/profile" className="hover:underline">Профиль</Link></li>
            <li><Link to="/login" className="hover:underline">Вход</Link></li>
          </ul>
        </nav>
      </header>
      
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
      
      <footer className="bg-gray-200 p-4 mt-8">
        <p>© 2026 Интернет-банк для клиентов</p>
      </footer>
    </div>
  );
};
