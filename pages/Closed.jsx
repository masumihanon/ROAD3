import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import "./Closed.css";
import FooterNav from "../components/FooterNav";

function Closed({
  currentAccount,
  notifications = [],
  setCurrentAccount,
  accounts = [],
  setAccounts,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [friends, setFriends] = useState([]);
  const [allMessages, setAllMessages] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortMode, setSortMode] = useState("latest");
  const [deleteMode, setDeleteMode] = useState(false);
  const [muteMode, setMuteMode] = useState(false);
  const [mutedFriendIds, setMutedFriendIds] = useState([]);
  const [isLayerOpen, setIsLayerOpen] = useState(false);

  const [isNameEditOpen, setIsNameEditOpen] = useState(false);
  const [editedName, setEditedName] = useState("");

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountHandle, setNewAccountHandle] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);

  useEffect(() => {
    const storedFriends = JSON.parse(
      localStorage.getItem("closedFriends") || "[]"
    );
    setFriends(storedFriends);

    const storedMessages = JSON.parse(
      localStorage.getItem("chatMessages") || "{}"
    );
    setAllMessages(storedMessages);

    const storedMuted = JSON.parse(
      localStorage.getItem("closedMutedFriends") || "[]"
    );
    setMutedFriendIds(storedMuted);
  }, [location.pathname]);

  useEffect(() => {
    setEditedName(currentAccount?.name || "");
  }, [currentAccount]);

  const saveFriends = (updatedFriends) => {
    setFriends(updatedFriends);
    localStorage.setItem("closedFriends", JSON.stringify(updatedFriends));
  };

  const saveMessages = (updatedMessages) => {
    setAllMessages(updatedMessages);
    localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
  };

  const saveMutedFriendIds = (updatedMutedIds) => {
    setMutedFriendIds(updatedMutedIds);
    localStorage.setItem(
      "closedMutedFriends",
      JSON.stringify(updatedMutedIds)
    );
  };

  const isMuted = (friendId) => {
    return mutedFriendIds.includes(String(friendId));
  };

  const getLastMessage = (friendId) => {
    const messages = allMessages[friendId] || [];
    if (messages.length === 0) return "まだメッセージはありません";

    const last = messages[messages.length - 1];

    if (last.type === "stamp") return "スタンプを送信しました";
    if (last.type === "image") return "画像を送信しました";
    if (last.type === "file") return last.fileName || "ファイルを送信しました";

    return last.text || "メッセージ";
  };

  const getLastTime = (friendId) => {
    const messages = allMessages[friendId] || [];
    if (messages.length === 0) return "";

    const last = messages[messages.length - 1];
    return last.time || "";
  };

  const getLastTimestamp = (friendId) => {
    const messages = allMessages[friendId] || [];
    if (messages.length === 0) return 0;

    const last = messages[messages.length - 1];
    return last.timestamp || 0;
  };

  const getUnreadCount = (friendId) => {
    if (isMuted(friendId)) return 0;

    const messages = allMessages[friendId] || [];

    return messages.filter((msg) => {
      const isMine =
        String(msg.senderId ?? "") === String(currentAccount?.id ?? "");
      return !isMine && msg.read === false;
    }).length;
  };

  const sortedFriends = useMemo(() => {
    const copied = [...friends];

    if (sortMode === "name") {
      return copied.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    }

    return copied.sort(
      (a, b) => getLastTimestamp(b.id) - getLastTimestamp(a.id)
    );
  }, [friends, allMessages, sortMode]);

  const handleMarkAllRead = () => {
    const updatedMessages = { ...allMessages };

    Object.keys(updatedMessages).forEach((friendId) => {
      updatedMessages[friendId] = (updatedMessages[friendId] || []).map(
        (msg) => {
          const isMine =
            String(msg.senderId ?? "") === String(currentAccount?.id ?? "");

          if (!isMine && msg.read !== true) {
            return {
              ...msg,
              read: true,
              readCount: 1,
            };
          }
          return msg;
        }
      );
    });

    saveMessages(updatedMessages);
    setMenuOpen(false);
  };

  const handleDeleteFriend = (friendId) => {
    const targetFriend = friends.find(
      (friend) => String(friend.id) === String(friendId)
    );
    const confirmDelete = window.confirm(
      `${targetFriend?.name || "このトーク"}を削除しますか？`
    );
    if (!confirmDelete) return;

    const updatedFriends = friends.filter(
      (friend) => String(friend.id) !== String(friendId)
    );

    const updatedMessages = { ...allMessages };
    delete updatedMessages[friendId];

    const updatedMutedIds = mutedFriendIds.filter(
      (id) => String(id) !== String(friendId)
    );

    saveFriends(updatedFriends);
    saveMessages(updatedMessages);
    saveMutedFriendIds(updatedMutedIds);

    setDeleteMode(false);
  };

  const handleToggleMute = (friendId) => {
    const friend = friends.find((item) => String(item.id) === String(friendId));
    const currentlyMuted = isMuted(friendId);

    const updatedMutedIds = currentlyMuted
      ? mutedFriendIds.filter((id) => String(id) !== String(friendId))
      : [...mutedFriendIds, String(friendId)];

    saveMutedFriendIds(updatedMutedIds);

    alert(
      currentlyMuted
        ? `${friend?.name || "このトーク"}のミュートを解除しました`
        : `${friend?.name || "このトーク"}をミュートしました`
    );

    setMuteMode(false);
  };

  const handleFriendClick = (friendId) => {
    if (deleteMode) {
      handleDeleteFriend(friendId);
      return;
    }

    if (muteMode) {
      handleToggleMute(friendId);
      return;
    }

    navigate(`/chat/${friendId}`);
  };

  const handleSaveName = () => {
    const nextName = editedName.trim();
    if (!nextName || !currentAccount) return;

    const updatedCurrent = {
      ...currentAccount,
      name: nextName,
    };

    const updatedAccounts = (accounts || []).map((acc) =>
      String(acc.id) === String(currentAccount.id) ? updatedCurrent : acc
    );

    if (setCurrentAccount) setCurrentAccount(updatedCurrent);
    if (setAccounts) setAccounts(updatedAccounts);

    localStorage.setItem("currentAccount", JSON.stringify(updatedCurrent));
    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));

    setIsNameEditOpen(false);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setNewAvatar(reader.result);
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

    const updatedAccounts = [...accounts, newAccount];

    if (setAccounts) setAccounts(updatedAccounts);
    if (setCurrentAccount) setCurrentAccount(newAccount);

    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
    localStorage.setItem("currentAccount", JSON.stringify(newAccount));

    setNewAccountName("");
    setNewAccountHandle("");
    setNewAvatar(null);
    setIsAccountOpen(false);
  };

  return (
    <div className="closed-page">
      <header className="closed-header">
        <div className="closed-logo" onClick={() => navigate("/")}>
          ROAD3
        </div>

        <div className="closed-header-actions">
          <button
            className="icon-button"
            onClick={() => navigate("/friend-add")}
            aria-label="友だち追加"
            title="友だち追加"
          >
            ＋
          </button>

          <button
            className="icon-button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="メニュー"
            title="メニュー"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="closed-menu-popup">
            <button
              onClick={() => {
                setSortMode("latest");
                setMenuOpen(false);
                setDeleteMode(false);
                setMuteMode(false);
              }}
            >
              トーク並べ替え（最新順）
            </button>

            <button
              onClick={() => {
                setSortMode("name");
                setMenuOpen(false);
                setDeleteMode(false);
                setMuteMode(false);
              }}
            >
              トーク並べ替え（名前順）
            </button>

            <button onClick={handleMarkAllRead}>全件既読</button>

            <button
              onClick={() => {
                setMuteMode((prev) => !prev);
                setDeleteMode(false);
                setMenuOpen(false);
              }}
            >
              {muteMode ? "ミュート設定終了" : "ミュート設定"}
            </button>

            <button
              onClick={() => {
                setDeleteMode((prev) => !prev);
                setMuteMode(false);
                setMenuOpen(false);
              }}
            >
              {deleteMode ? "削除モード終了" : "トーク削除"}
            </button>
          </div>
        )}
      </header>

      <section className="closed-account-area">
        <div className="closed-account-row">
          <div className="closed-account-badge">
            {currentAccount?.avatarImage ? (
              <img
                src={currentAccount.avatarImage}
                alt={currentAccount?.name || "avatar"}
                className="closed-account-badge avatar-image"
              />
            ) : (
              <span>{(currentAccount?.name || "個").charAt(0)}</span>
            )}
          </div>

          <p className="closed-account-name">
            {currentAccount?.name || "個人名"}
          </p>

          <button
            type="button"
            className="closed-account-edit"
            onClick={() => setIsNameEditOpen(true)}
            aria-label="名前変更"
            title="名前変更"
          >
            ✎
          </button>
        </div>

        {deleteMode && (
          <p className="closed-mode-note">
            削除したいトークをタップしてください
          </p>
        )}

        {muteMode && (
          <p className="closed-mode-note">
            ミュート設定したいトークをタップしてください
          </p>
        )}

        {!deleteMode && !muteMode && sortMode === "latest" && (
          <p className="closed-mode-note subtle">並び順：最新順</p>
        )}

        {!deleteMode && !muteMode && sortMode === "name" && (
          <p className="closed-mode-note subtle">並び順：名前順</p>
        )}
      </section>

      <main className="friend-list">
        {sortedFriends.length === 0 ? (
          <div className="closed-empty">
            <p>まだ友だちがいません</p>
            <button
              className="closed-empty-button"
              onClick={() => navigate("/friend-add")}
            >
              友だちを追加する
            </button>
          </div>
        ) : (
          sortedFriends.map((friend) => {
            const unreadCount = getUnreadCount(friend.id);
            const lastMessage = getLastMessage(friend.id);
            const lastTime = getLastTime(friend.id);
            const muted = isMuted(friend.id);

            return (
              <div
                key={friend.id}
                className={`friend-item ${
                  deleteMode ? "delete-mode" : ""
                } ${muteMode ? "mute-mode" : ""} ${
                  muted ? "muted-card" : ""
                }`}
                onClick={() => handleFriendClick(friend.id)}
              >
                <div className="friend-avatar">
                  {friend.avatarImage ? (
                    <img
                      src={friend.avatarImage}
                      alt={friend.name || "avatar"}
                      className="friend-avatar avatar-image"
                    />
                  ) : (
                    <span>{friend.avatar}</span>
                  )}
                </div>

                <div className="friend-main">
                  <div className="friend-top-row">
                    <div className="friend-name-wrap">
                      <p className="friend-name">{friend.name}</p>
                      {muted && (
                        <span className="friend-muted-tag">🔕 ミュート中</span>
                      )}
                    </div>
                    <span className="friend-time">{lastTime}</span>
                  </div>

                  <div className="friend-bottom-row">
                    <p
                      className={`friend-last-message ${
                        muted ? "muted-text" : ""
                      }`}
                    >
                      {lastMessage}
                    </p>

                    {deleteMode ? (
                      <span className="friend-delete-badge">削除</span>
                    ) : muteMode ? (
                      <span className="friend-mute-badge">
                        {muted ? "解除" : "ミュート"}
                      </span>
                    ) : muted ? (
                      <span className="friend-muted-badge">🔕</span>
                    ) : (
                      unreadCount > 0 && (
                        <span className="friend-unread-badge">
                          {unreadCount}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

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
              className="layer-modal-item is-disabled"
              disabled
            >
              <div className="layer-modal-main">
                <strong>クローズドスペース</strong>
                <span>限られた相手との場</span>
              </div>
              <span className="layer-modal-arrow"></span>
            </button>

            <button
              type="button"
              className="layer-modal-item"
              onClick={() => navigate("/personal")}
            >
              <div className="layer-modal-main">
                <strong>パーソナルスペース</strong>
                <span>自分の拠点</span>
              </div>
              <span className="layer-modal-arrow">›</span>
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

      {isNameEditOpen && (
        <div
          className="layer-modal-overlay"
          onClick={() => setIsNameEditOpen(false)}
        >
          <div
            className="layer-modal closed-name-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="layer-modal-title">名前変更</h3>

            <input
              className="closed-name-input"
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="名前を入力"
            />

            <div className="closed-name-actions">
              <button
                type="button"
                className="closed-name-save"
                onClick={handleSaveName}
              >
                保存
              </button>

              <button
                type="button"
                className="layer-modal-close"
                onClick={() => setIsNameEditOpen(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

     {/* ===== アカウントモーダル ===== */}
{isAccountOpen && (
  <div
    className="layer-modal-overlay"
    onClick={() => setIsAccountOpen(false)}
  >
    <div className="layer-modal" onClick={(e) => e.stopPropagation()}>
      <h3 className="layer-modal-title">アカウント</h3>

      <div className="account-list">
        {accounts.map((acc) => (
          <button
            key={acc.id}
            className={`account-item ${
              String(acc.id) === String(currentAccount?.id)
                ? "active"
                : ""
            }`}
            onClick={() => {
              if (setCurrentAccount) setCurrentAccount(acc);
              localStorage.setItem("currentAccount", JSON.stringify(acc));
              setIsAccountOpen(false);
            }}
          >
            <div className="account-avatar">
              {acc.avatarImage ? (
                <img
                  src={acc.avatarImage}
                  alt={acc.name || "avatar"}
                  className="account-avatar-image"
                />
              ) : (
                <span>{acc.name?.charAt(0) || "?"}</span>
              )}
            </div>

            <div className="account-meta">
              <strong>{acc.name}</strong>
              <span>{acc.handle || "@---"}</span>
            </div>
          </button>
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
        <button
          type="button"
          className="modal-primary"
          onClick={handleAddAccount}
        >
          追加
        </button>

        <button
          type="button"
          className="modal-secondary"
          onClick={() => setIsAccountOpen(false)}
        >
          閉じる
        </button>
      </div>
    </div>
  </div>
)}

      <FooterNav
        notifications={notifications}
        onOpenSignals={() =>
          navigate("/activity/signals", { state: { from: "/closed" } })
        }
        onOpenSaved={() =>
          navigate("/activity/saved", { state: { from: "/closed" } })
        }
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenNotifications={() =>
          navigate("/activity/notifications", { state: { from: "/closed" } })
        }
        onOpenLayer={() => setIsLayerOpen(true)}
      />
    </div>
  );
}

export default Closed;