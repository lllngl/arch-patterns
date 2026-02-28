import { Link } from "react-router-dom";
import "./ErrorPage.css";

interface ErrorPageProps {
  code?: number;
}

export const ErrorPage = ({ code = 500 }: ErrorPageProps) => {
  const getMessage = (errorCode: number) => {
    switch (errorCode) {
      case 404:
        return 'Страница не найдена';
      case 403:
        return 'Доступ запрещен';
      case 500:
      default:
        return 'Внутренняя ошибка сервера';
    }
  };

  return (
    <div className="error-page">
      <h1 className="error-code">{code}</h1>
      <p className="error-message">{getMessage(code)}</p>
      <Link to="/" className="error-link">
        Вернуться на главную
      </Link>
    </div>
  );
};
