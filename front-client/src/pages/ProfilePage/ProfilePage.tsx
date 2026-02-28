import { useAuth } from "../../auth/AuthContext";
import "./ProfilePage.css";

export const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <section className="profile-page">
      <h1 className="profile-page-title">Профиль клиента</h1>
      <div className="profile-grid">
        <div className="profile-item">
          <span className="profile-label">Имя</span>
          <span className="profile-value">{user?.firstName ?? "-"}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Фамилия</span>
          <span className="profile-value">{user?.lastName ?? "-"}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Email</span>
          <span className="profile-value">{user?.email ?? "-"}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Роль</span>
          <span className="profile-value">{user?.role ?? "-"}</span>
        </div>
      </div>
    </section>
  );
};
