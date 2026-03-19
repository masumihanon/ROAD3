import "./FooterNav.css";

function FooterNav({
  onOpenSignals,
  onOpenSaved,
  onOpenAccount,
  onOpenNotifications,
  onOpenLayer,
  notifications = [],
  activeTab = "",
}) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <nav className="footer-nav">
      <button
        type="button"
        className={`footer-nav-item ${activeTab === "signals" ? "active" : ""}`}
        onClick={onOpenSignals}
      >
        シグナル
      </button>

      <button
        type="button"
        className={`footer-nav-item ${activeTab === "saved" ? "active" : ""}`}
        onClick={onOpenSaved}
      >
        いいね・保存
      </button>

      <button
        type="button"
        className={`footer-nav-item ${activeTab === "account" ? "active" : ""}`}
        onClick={onOpenAccount}
      >
        アカウント
      </button>

      <button
        type="button"
        className={`footer-nav-item footer-nav-notification ${
          activeTab === "notifications" ? "active" : ""
        }`}
        onClick={onOpenNotifications}
      >
        通知
        {unreadCount > 0 && (
          <span className="footer-nav-badge">{unreadCount}</span>
        )}
      </button>

      <button
        type="button"
        className={`footer-nav-item ${activeTab === "layer" ? "active" : ""}`}
        onClick={onOpenLayer}
      >
        階層
      </button>
    </nav>
  );
}

export default FooterNav;