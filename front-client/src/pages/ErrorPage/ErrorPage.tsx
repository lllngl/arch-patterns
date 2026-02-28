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
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-red-500">{code}</h1>
      <p className="text-xl mt-4">{getMessage(code)}</p>
      <a 
        href="/" 
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Вернуться на главную
      </a>
    </div>
  );
};
