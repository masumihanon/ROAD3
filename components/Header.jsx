import { useEffect, useMemo, useRef, useState } from "react";
import "./Header.css";

function Header({
  currentAccount,
  setCurrentAccount,
  accounts,
  setAccounts,
  onCustomizeApps,
  onAddApp,
  onResetApps,
  onOpenContact,
  onOpenSettings,
  onLogout,
}) {
  const name = currentAccount?.name || "ゲスト";
  const initial = useMemo(() => (name ? name.charAt(0) : "?"), [name]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);

  useEffect(() => {
    setEditedName(name);
    setIsEditing(false);
  }, [name]);

  const saveName = () => {
    const trimmed = editedName.trim();
    if (!trimmed || !currentAccount) return;

    const updatedAccounts = accounts.map((acc) =>
      acc.id === currentAccount.id ? { ...acc, name: trimmed } : acc
    );
    setAccounts(updatedAccounts);

    const updatedCurrent = { ...currentAccount, name: trimmed };
    setCurrentAccount(updatedCurrent);

    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
    localStorage.setItem("currentAccount", JSON.stringify(updatedCurrent));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      saveName();
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      saveName();
      setIsEditing(false);
    }
    if (e.key === "Escape") {
      setEditedName(name);
      setIsEditing(false);
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="app-header">
      <div className="header-menuWrap" ref={menuRef}>
        <button
          type="button"
          className="menu-icon"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="メニュー"
          title="メニュー"
        >
          ⋮
        </button>

        {menuOpen && (
          <div className="header-dropdown" role="menu">
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                closeMenu();
                onCustomizeApps?.();
              }}
            >
              アプリをカスタマイズ
            </button>

            <button
              type="button"
              className="menu-item"
              onClick={() => {
                closeMenu();
                onAddApp?.();
              }}
            >
              アプリを追加
            </button>

            <button
              type="button"
              className="menu-item"
              onClick={() => {
                closeMenu();
                onResetApps?.();
              }}
            >
              初期配置にリセット
            </button>

            <div className="menu-sep" />

            <button
              type="button"
              className="menu-item"
              onClick={() => {
                closeMenu();
                onOpenContact?.();
              }}
            >
              お問い合わせ
            </button>

            <button
              type="button"
              className="menu-item"
              onClick={() => {
                closeMenu();
                onOpenSettings?.();
              }}
            >
              設定
            </button>

            <div className="menu-sep" />

            <button
              type="button"
              className="menu-item danger"
              onClick={() => {
                closeMenu();
                onLogout?.();
              }}
            >
              ログアウト
            </button>
          </div>
        )}
      </div>

      <div className="header-center">
        <h1 className="app-logo">ROAD3</h1>

        <div className="user-row">
          <div className="user-avatar" aria-hidden="true">
            {currentAccount?.avatarImage ? (
              <img
                src={currentAccount.avatarImage}
                alt={name}
                className="user-avatar-image"
              />
            ) : (
              initial
            )}
          </div>

          {isEditing ? (
            <input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="name-input"
              autoFocus
            />
          ) : (
            <span className="user-name">{name}</span>
          )}

          <button
            type="button"
            className="edit-icon"
            onClick={handleEditToggle}
            aria-label="名前を編集"
            title="名前を編集"
          >
            ✏️
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;