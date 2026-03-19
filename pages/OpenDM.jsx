import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./OpenDM.css";

function OpenDM() {
  const navigate = useNavigate();
  const location = useLocation();

  const [chats, setChats] = useState([]);
  const [menuChat, setMenuChat] = useState(null);

  const longPressTimer = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("dmChats") || "[]");
    const blockedUsers = JSON.parse(localStorage.getItem("blockedUsers") || "[]");

    const visibleChats = saved.filter(
      (chat) => !blockedUsers.includes(String(chat.userId))
    );

    if (visibleChats.length > 0) {
      const sorted = [...visibleChats].sort((a, b) => {
        const timeA = a.updatedAt || 0;
        const timeB = b.updatedAt || 0;
        return timeB - timeA;
      });
      setChats(sorted);
    } else {
      const demoChats = [
        {
          userId: "hanon",
          name: "はのん",
          handle: "@hanon",
          time: "10:30",
          lastMessage: "こんにちは！",
          unread: 1,
          updatedAt: Date.now(),
          messages: [
            {
              id: 1,
              sender: "other",
              text: "こんにちは！",
              time: "10:30",
            },
            {
              id: 2,
              sender: "me",
              text: "やっほー",
              time: "10:31",
              isRead: true,
            },
          ],
        },
      ];

      localStorage.setItem("dmChats", JSON.stringify(demoChats));
      setChats(demoChats);
    }
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      const saved = JSON.parse(localStorage.getItem("dmChats") || "[]");
      const blockedUsers = JSON.parse(localStorage.getItem("blockedUsers") || "[]");

      const visibleChats = saved.filter(
        (chat) => !blockedUsers.includes(String(chat.userId))
      );

      const sorted = [...visibleChats].sort((a, b) => {
        const timeA = a.updatedAt || 0;
        const timeB = b.updatedAt || 0;
        return timeB - timeA;
      });

      setChats(sorted);
    }
  }, [location.state]);

  const openChat = (chat) => {
    if (menuChat) return;

    const saved = JSON.parse(localStorage.getItem("dmChats") || "[]");

    const updatedChats = saved.map((c) => {
      if (c.userId === chat.userId) {
        return {
          ...c,
          unread: 0,
        };
      }
      return c;
    });

    localStorage.setItem("dmChats", JSON.stringify(updatedChats));

    const targetChat =
      updatedChats.find((c) => c.userId === chat.userId) || {
        ...chat,
        unread: 0,
      };

    navigate(`/dm/chat/${chat.userId}`, {
      state: { chat: targetChat },
    });
  };

  const startLongPress = (chat) => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setMenuChat(chat);
    }, 500);
  };

  const cancelLongPress = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleDeleteChat = () => {
    if (!menuChat) return;

    const confirmed = window.confirm(`${menuChat.name}とのDMを削除しますか？`);
    if (!confirmed) return;

    const saved = JSON.parse(localStorage.getItem("dmChats") || "[]");
    const updatedChats = saved.filter(
      (chat) => String(chat.userId) !== String(menuChat.userId)
    );

    localStorage.setItem("dmChats", JSON.stringify(updatedChats));

    const blockedUsers = JSON.parse(localStorage.getItem("blockedUsers") || "[]");
    const visibleChats = updatedChats.filter(
      (chat) => !blockedUsers.includes(String(chat.userId))
    );

    const sorted = [...visibleChats].sort((a, b) => {
      const timeA = a.updatedAt || 0;
      const timeB = b.updatedAt || 0;
      return timeB - timeA;
    });

    setChats(sorted);
    setMenuChat(null);
  };

  const handleBlockUser = () => {
    if (!menuChat) return;

    const confirmed = window.confirm(`${menuChat.name}をブロックしますか？`);
    if (!confirmed) return;

    const savedBlockedUsers = JSON.parse(
      localStorage.getItem("blockedUsers") || "[]"
    );

    const updatedBlockedUsers = Array.from(
      new Set([...savedBlockedUsers, String(menuChat.userId)])
    );

    localStorage.setItem("blockedUsers", JSON.stringify(updatedBlockedUsers));

    setChats((prev) =>
      prev.filter((chat) => String(chat.userId) !== String(menuChat.userId))
    );
    setMenuChat(null);
  };

  return (
    <div className="dm-page">
      <div className="dm-header">
        <button type="button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h2>DM</h2>
        <button type="button" onClick={() => navigate("/dm/settings")}>
          ☰
        </button>
      </div>

      <div className="dm-list">
        {chats.length === 0 && (
          <p className="dm-empty">まだDMはありません</p>
        )}

        {chats.map((chat) => (
          <div
            key={chat.userId}
            className="dm-item"
            onClick={() => openChat(chat)}
            onMouseDown={() => startLongPress(chat)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={() => startLongPress(chat)}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenuChat(chat);
            }}
          >
            <div className="dm-avatar">{chat.name?.charAt(0)}</div>

            <div className="dm-info">
              <div className="dm-top">
                <strong>{chat.name}</strong>

                <div className="dm-right">
                  <span className="dm-time">{chat.time}</span>

                  {chat.unread > 0 && (
                    <span className="dm-badge">{chat.unread}</span>
                  )}
                </div>
              </div>

              <p className="dm-last">{chat.lastMessage}</p>
            </div>
          </div>
        ))}
      </div>

      {menuChat && (
        <>
          <div className="dm-menu-overlay" onClick={() => setMenuChat(null)} />

          <div className="dm-menu-sheet">
            <div className="dm-menu-title">{menuChat.name}</div>

            <button
              type="button"
              className="dm-menu-item danger"
              onClick={handleDeleteChat}
            >
              削除
            </button>

            <button
              type="button"
              className="dm-menu-item danger"
              onClick={handleBlockUser}
            >
              ブロック
            </button>

            <button
              type="button"
              className="dm-menu-item"
              onClick={() => setMenuChat(null)}
            >
              閉じる
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default OpenDM;