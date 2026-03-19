import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Personal.css";
import PersonalFooterNav from "../components/PersonalFooterNav";

function Personal({
  currentAccount,
  setCurrentAccount,
  setAccounts,
  accounts,
  notifications,
  setNotifications,
}) {
  const navigate = useNavigate();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLayerOpen, setIsLayerOpen] = useState(false);

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingAccountName, setEditingAccountName] = useState("");
  const [editingAccountHandle, setEditingAccountHandle] = useState("");
  const [editingAvatar, setEditingAvatar] = useState(null);

  const APP_STORAGE_KEY = "personalApps_v1";

  const DEFAULT_APPS = useMemo(
    () => [
      {
        id: "calendar",
        label: "カレンダー",
        icon: "📅",
        route: "/personal/calendar",
      },
      {
        id: "memo",
        label: "メモ",
        icon: "📝",
        route: "/personal/memo",
      },
      {
        id: "hint",
        label: "ヒント",
        icon: "💡",
        route: null,
      },
      {
        id: "follow",
        label: "フォロー",
        icon: "👥",
        route: null,
      },
    ],
    []
  );

  const [apps, setApps] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(APP_STORAGE_KEY));
      return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_APPS;
    } catch {
      return DEFAULT_APPS;
    }
  });

  useEffect(() => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(apps));
  }, [apps, APP_STORAGE_KEY]);

  useEffect(() => {
    const openCustomize = () => setIsCustomizeOpen(true);
    const openAddApp = () => setIsAddAppOpen(true);
    const openContact = () => setIsContactOpen(true);
    const openSettings = () => setIsSettingsOpen(true);

    const resetAppsFromHeader = () => {
      const ok = window.confirm("アプリ配置を初期化する？");
      if (!ok) return;

      setApps(DEFAULT_APPS);
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(DEFAULT_APPS));
      setIsCustomizeOpen(false);
    };

    window.addEventListener("road3-open-customize", openCustomize);
    window.addEventListener("road3-open-add-app", openAddApp);
    window.addEventListener("road3-open-contact", openContact);
    window.addEventListener("road3-open-settings", openSettings);
    window.addEventListener("road3-reset-apps", resetAppsFromHeader);

    return () => {
      window.removeEventListener("road3-open-customize", openCustomize);
      window.removeEventListener("road3-open-add-app", openAddApp);
      window.removeEventListener("road3-open-contact", openContact);
      window.removeEventListener("road3-open-settings", openSettings);
      window.removeEventListener("road3-reset-apps", resetAppsFromHeader);
    };
  }, [DEFAULT_APPS, APP_STORAGE_KEY]);

  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountHandle, setNewAccountHandle] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setNewAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleEditAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEditingAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddAccount = () => {
    const name = newAccountName.trim();
    const handle = newAccountHandle.trim();

    if (!name) return;

    const newAccount = {
      id: Date.now(),
      type: "personal",
      name,
      handle: handle || `@${name}`,
      avatarImage: newAvatar || null,
    };

    const updated = [...accounts, newAccount];
    setAccounts(updated);
    setCurrentAccount(newAccount);

    localStorage.setItem("accounts", JSON.stringify(updated));
    localStorage.setItem("currentAccount", JSON.stringify(newAccount));

    setNewAccountName("");
    setNewAccountHandle("");
    setNewAvatar(null);
    setIsAccountOpen(false);
  };

  const startEditAccount = (account) => {
    setEditingAccountId(account.id);
    setEditingAccountName(account.name || "");
    setEditingAccountHandle(account.handle || "");
    setEditingAvatar(account.avatarImage || null);
  };

  const cancelEditAccount = () => {
    setEditingAccountId(null);
    setEditingAccountName("");
    setEditingAccountHandle("");
    setEditingAvatar(null);
  };

  const handleSaveEditAccount = () => {
    if (!editingAccountId) return;

    const nextName = editingAccountName.trim();
    const nextHandle = editingAccountHandle.trim();

    if (!nextName) return;

    const updatedAccounts = (accounts || []).map((acc) =>
      String(acc.id) === String(editingAccountId)
        ? {
            ...acc,
            name: nextName,
            handle: nextHandle || `@${nextName}`,
            avatarImage: editingAvatar || null,
          }
        : acc
    );

    const updatedCurrent =
      String(currentAccount?.id) === String(editingAccountId)
        ? updatedAccounts.find(
            (acc) => String(acc.id) === String(editingAccountId)
          ) || currentAccount
        : currentAccount;

    setAccounts(updatedAccounts);
    if (updatedCurrent) {
      setCurrentAccount(updatedCurrent);
      localStorage.setItem("currentAccount", JSON.stringify(updatedCurrent));
    }

    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
    cancelEditAccount();
  };

  const moveApp = (index, direction) => {
    const next = [...apps];
    const target = index + direction;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    setApps(next);
  };

  const removeApp = (id) => {
    const ok = window.confirm("このアプリを外す？");
    if (!ok) return;

    setApps((prev) => prev.filter((app) => app.id !== id));
  };

  const addApp = (app) => {
    const exists = apps.some((a) => a.id === app.id);
    if (exists) return;

    setApps((prev) => [...prev, app]);
    setIsAddAppOpen(false);
  };

  const availableApps = [
    {
      id: "calendar",
      label: "カレンダー",
      icon: "📅",
      route: "/personal/calendar",
    },
    {
      id: "memo",
      label: "メモ",
      icon: "📝",
      route: "/personal/memo",
    },
    {
      id: "hint",
      label: "ヒント",
      icon: "💡",
      route: null,
    },
    {
      id: "follow",
      label: "フォロー",
      icon: "👥",
      route: null,
    },
  ].filter((candidate) => !apps.some((app) => app.id === candidate.id));

  const openApp = (app) => {
    if (app.route) {
      navigate(app.route);
      return;
    }

    if (app.id === "hint") {
      alert("ヒントはこれから中身を作っていくよ。");
      return;
    }

    if (app.id === "follow") {
      alert("フォロー機能はこれから実装していくよ。");
      return;
    }
  };

  const renderAccountAvatar = (account) => {
    if (account?.avatarImage) {
      return (
        <img
          src={account.avatarImage}
          alt={account.name || "avatar"}
          className="account-avatar-image"
        />
      );
    }

    return <span>{account?.name?.charAt(0) || "?"}</span>;
  };

  return (
    <div className="personal-page">
      <main className="personal-main">
        <div className="app-grid">
          {apps.map((app, index) => (
            <div key={app.id} className="app-tileWrap">
              {isCustomizeOpen && (
                <div className="app-editTools">
                  <button type="button" onClick={() => moveApp(index, -1)}>
                    ↑
                  </button>
                  <button type="button" onClick={() => moveApp(index, 1)}>
                    ↓
                  </button>
                  <button type="button" onClick={() => removeApp(app.id)}>
                    ×
                  </button>
                </div>
              )}

              <button
                type="button"
                className="app-tile"
                onClick={() => openApp(app)}
              >
                <span className="app-icon">{app.icon}</span>
                <span className="app-label">{app.label}</span>
              </button>
            </div>
          ))}

          {isCustomizeOpen && (
            <button
              type="button"
              className="app-tile add-tile"
              onClick={() => setIsAddAppOpen(true)}
            >
              <span className="app-addPlus">＋</span>
              <span className="app-label">アプリ追加</span>
            </button>
          )}
        </div>
      </main>

      {isAccountOpen && (
        <div className="layer-overlay" onClick={() => setIsAccountOpen(false)}>
          <div className="layer-modal" onClick={(e) => e.stopPropagation()}>
            <h3>アカウント</h3>

            <div className="account-list">
              {accounts.map((acc) => (
                <div key={acc.id} className="account-item-row">
                  <button
                    className="account-item"
                    onClick={() => {
                      setCurrentAccount(acc);
                      localStorage.setItem("currentAccount", JSON.stringify(acc));
                      setIsAccountOpen(false);
                    }}
                  >
                    <div className="account-avatar">
                      {renderAccountAvatar(acc)}
                    </div>

                    <div className="account-meta">
                      <strong>{acc.name}</strong>
                      <span>{acc.handle || "@---"}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="account-edit-button"
                    onClick={() => startEditAccount(acc)}
                  >
                    編集
                  </button>
                </div>
              ))}
            </div>

            <div className="modal-divider" />

            <h4>アカウント追加</h4>

            <input
              className="modal-input"
              type="text"
              placeholder="名前"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
            />

            <input
              className="modal-input"
              type="text"
              placeholder="@ID"
              value={newAccountHandle}
              onChange={(e) => setNewAccountHandle(e.target.value)}
            />

            <input
              className="modal-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
            />

            {newAvatar && (
              <div className="personal-avatar-preview">
                <img
                  src={newAvatar}
                  alt="preview"
                  className="personal-avatar-preview-image"
                />
              </div>
            )}

            <div className="modal-actions">
              <button className="modal-primary" onClick={handleAddAccount}>
                追加
              </button>
              <button
                className="modal-secondary"
                onClick={() => {
                  setIsAccountOpen(false);
                  setNewAvatar(null);
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {editingAccountId && (
        <div className="layer-overlay" onClick={cancelEditAccount}>
          <div className="layer-modal" onClick={(e) => e.stopPropagation()}>
            <h3>アカウント編集</h3>

            <input
              className="modal-input"
              type="text"
              placeholder="名前"
              value={editingAccountName}
              onChange={(e) => setEditingAccountName(e.target.value)}
            />

            <input
              className="modal-input"
              type="text"
              placeholder="@ID"
              value={editingAccountHandle}
              onChange={(e) => setEditingAccountHandle(e.target.value)}
            />

            <input
              className="modal-input"
              type="file"
              accept="image/*"
              onChange={handleEditAvatarUpload}
            />

            {editingAvatar && (
              <div className="personal-avatar-preview">
                <img
                  src={editingAvatar}
                  alt="preview"
                  className="personal-avatar-preview-image"
                />
              </div>
            )}

            <div className="modal-actions">
              <button className="modal-primary" onClick={handleSaveEditAccount}>
                保存
              </button>
              <button className="modal-secondary" onClick={cancelEditAccount}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {isLayerOpen && (
        <div
          className="layer-modal-overlay"
          onClick={() => setIsLayerOpen(false)}
        >
          <div className="layer-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="layer-modal-title">階層移動</h3>

            <button
              type="button"
              className="layer-modal-item"
              onClick={() => navigate("/open")}
            >
              <div className="layer-modal-main">
                <strong>オープンスペース</strong>
                <span>広くつながるタイムライン</span>
              </div>
              <span className="layer-modal-arrow">›</span>
            </button>

            <button
              type="button"
              className="layer-modal-item"
              onClick={() => navigate("/group")}
            >
              <div className="layer-modal-main">
                <strong>グループスペース</strong>
                <span>仲間ごとの場</span>
              </div>
              <span className="layer-modal-arrow">›</span>
            </button>

            <button
              type="button"
              className="layer-modal-item"
              onClick={() => navigate("/closed")}
            >
              <div className="layer-modal-main">
                <strong>クローズドスペース</strong>
                <span>限られた相手との場</span>
              </div>
              <span className="layer-modal-arrow">›</span>
            </button>

            <button
              type="button"
              className="layer-modal-item is-disabled"
              disabled
            >
              <div className="layer-modal-main">
                <strong>パーソナルスペース</strong>
                <span>自分の拠点</span>
              </div>
              <span className="layer-modal-arrow"></span>
            </button>

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

      {isAddAppOpen && (
        <div className="layer-overlay" onClick={() => setIsAddAppOpen(false)}>
          <div className="layer-modal" onClick={(e) => e.stopPropagation()}>
            <h3>アプリ追加</h3>

            {availableApps.length === 0 ? (
              <p>追加できるアプリはありません。</p>
            ) : (
              <div className="account-list">
                {availableApps.map((app) => (
                  <button
                    key={app.id}
                    className="account-item"
                    onClick={() => addApp(app)}
                  >
                    <div className="account-avatar">{app.icon}</div>
                    <div className="account-meta">
                      <strong>{app.label}</strong>
                      <span>{app.route || "準備中"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              className="modal-secondary"
              onClick={() => setIsAddAppOpen(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <PersonalFooterNav
        onOpenLayer={() => setIsLayerOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        notifications={notifications}
      />
    </div>
  );
}

export default Personal;