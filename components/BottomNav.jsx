import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import "./BottomNav.css";

function BottomNav({ notifications = [], currentAccount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLayerOpen, setIsLayerOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const unreadCount = notifications.filter(
    (n) => String(n.accountId) === String(currentAccount?.id) && !n.read
  ).length;

  const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
  const pathname = location.pathname;

  const currentLayer = useMemo(() => {
    if (pathname.startsWith("/open")) return "open";
    if (pathname.startsWith("/group")) return "group";
    if (pathname.startsWith("/closed")) return "closed";
    if (pathname.startsWith("/personal")) return "personal";
    return "";
  }, [pathname]);

  const moveToLayer = (path) => {
    setIsLayerOpen(false);
    navigate(path);
  };

  const layerItems = [
    {
      key: "open",
      title: "オープンスペース",
      description: "広くつながるタイムライン",
      path: "/open",
    },
    {
      key: "group",
      title: "グループスペース",
      description: "仲間ごとの場",
      path: "/group",
    },
    {
      key: "closed",
      title: "クローズドスペース",
      description: "限られた相手との場",
      path: "/closed",
    },
    {
      key: "personal",
      title: "パーソナルスペース",
      description: "自分の拠点",
      path: "/personal",
    },
  ];

  return (
    <>
      <div className="bottom-nav">
        <NavLink to="/open" className="nav-item">
          ホーム
        </NavLink>

        <button
          type="button"
          className="nav-item nav-button"
          onClick={() => navigate("/search")}
        >
          検索
        </button>

        <button
          type="button"
          className="nav-item nav-button"
          onClick={() => setIsAccountOpen(true)}
        >
          アカウント
        </button>

        <NavLink to="/notifications" className="nav-item nav-notification">
          通知
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </NavLink>

        <button
          type="button"
          className="nav-item nav-button"
          onClick={() => setIsLayerOpen(true)}
        >
          階層移動
        </button>
      </div>

      {isAccountOpen && (
        <div
          className="layer-modal-overlay"
          onClick={() => setIsAccountOpen(false)}
        >
          <div
            className="layer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="layer-modal-title">アカウント切替</h3>

            {accounts.map((account) => {
              const isCurrent = String(currentAccount?.id) === String(account.id);

              return (
                <button
                  key={account.id}
                  type="button"
                  className={`layer-modal-item ${isCurrent ? "is-current" : ""}`}
                  onClick={() => {
                    localStorage.setItem(
                      "currentAccount",
                      JSON.stringify(account)
                    );
                    setIsAccountOpen(false);
                    window.location.reload();
                  }}
                >
                  <div className="layer-modal-main">
                    <strong>{account.name}</strong>
                    <span>{account.type}</span>
                  </div>

                  <span className="layer-modal-check">
                    {isCurrent ? "✔" : ""}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              className="layer-modal-close"
              onClick={() => setIsAccountOpen(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {isLayerOpen && (
        <div
          className="layer-modal-overlay"
          onClick={() => setIsLayerOpen(false)}
        >
          <div
            className="layer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="layer-modal-title">階層移動</h3>

            {layerItems.map((item) => {
              const isCurrent = currentLayer === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`layer-modal-item ${isCurrent ? "is-disabled" : ""}`}
                  onClick={() => {
                    if (!isCurrent) moveToLayer(item.path);
                  }}
                  disabled={isCurrent}
                >
                  <div className="layer-modal-main">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>

                  <span className="layer-modal-arrow">
                    {isCurrent ? "" : "›"}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              className="layer-modal-close"
              onClick={() => setIsLayerOpen(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default BottomNav;