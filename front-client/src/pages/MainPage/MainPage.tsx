import "./MainPage.css";

export const MainPage = () => {
  return (
    <section className="main-page">
      <h1 className="main-page-title">Главная страница клиента</h1>
      <p className="main-page-text">Добро пожаловать в клиентское приложение интернет-банка.</p>
      <p className="main-page-note">
        Следующим шагом здесь добавим операции по счетам, кредитам и историю транзакций.
      </p>
    </section>
  );
};
