import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Chat.css";

function Chat({ currentAccount }) {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  const [allMessages, setAllMessages] = useState(() => {
    return JSON.parse(localStorage.getItem("chatMessages") || "{}");
  });

  const [input, setInput] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [assistOpen, setAssistOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const storedFriends = useMemo(() => {
    return JSON.parse(localStorage.getItem("closedFriends") || "[]");
  }, []);

  const friendInfo =
    storedFriends.find((friend) => String(friend.id) === String(friendId)) || {
      name: "友達",
      avatar: "友",
      avatarImage: null,
    };

  const messages = allMessages[friendId] || [];

  useEffect(() => {
    if (!currentAccount) return;

    const stored = JSON.parse(localStorage.getItem("chatMessages") || "{}");
    const currentMessages = stored[friendId] || [];

    let changed = false;

    const normalizedMessages = currentMessages.map((msg) => {
      let nextMsg = { ...msg };

      if (nextMsg.senderId === undefined || nextMsg.senderId === null) {
        const isFriendMessage = nextMsg.sender === friendInfo.name;

        if (!isFriendMessage) {
          nextMsg.senderId = currentAccount.id;
          changed = true;
        }
      }

      const isMine =
        String(nextMsg.senderId ?? "") === String(currentAccount.id ?? "");

      if (!isMine && nextMsg.read !== true) {
        nextMsg = {
          ...nextMsg,
          read: true,
          readCount: 1,
        };
        changed = true;
      }

      return nextMsg;
    });

    if (changed) {
      const updatedAll = {
        ...stored,
        [friendId]: normalizedMessages,
      };

      setAllMessages(updatedAll);
      localStorage.setItem("chatMessages", JSON.stringify(updatedAll));
    } else {
      setAllMessages(stored);
    }
  }, [friendId, currentAccount, friendInfo.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setAssistOpen(false);
        setAttachOpen(false);
        setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const saveMessages = (updated) => {
    setAllMessages(updated);
    localStorage.setItem("chatMessages", JSON.stringify(updated));
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      senderId: currentAccount?.id ?? null,
      sender: currentAccount?.name || "自分",
      text: input,
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
      readCount: 0,
      type: "text",
    };

    const updated = {
      ...allMessages,
      [friendId]: [...messages, newMessage],
    };

    saveMessages(updated);
    setInput("");
    setAttachOpen(false);
  };

  const handleSendStamp = () => {
    const newMessage = {
      id: Date.now(),
      senderId: currentAccount?.id ?? null,
      sender: currentAccount?.name || "自分",
      text: "👍",
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
      readCount: 0,
      type: "stamp",
    };

    const updated = {
      ...allMessages,
      [friendId]: [...messages, newMessage],
    };

    saveMessages(updated);
    setAttachOpen(false);
  };

  const handleSendImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const newMessage = {
        id: Date.now(),
        senderId: currentAccount?.id ?? null,
        sender: currentAccount?.name || "自分",
        text: file.name,
        fileName: file.name,
        image: reader.result,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: false,
        readCount: 0,
        type: "image",
      };

      const updated = {
        ...allMessages,
        [friendId]: [...messages, newMessage],
      };

      saveMessages(updated);
      setAttachOpen(false);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteTalk = () => {
    const confirmDelete = window.confirm("このトークを削除しますか？");
    if (!confirmDelete) return;

    const stored = JSON.parse(localStorage.getItem("chatMessages") || "{}");
    delete stored[friendId];

    localStorage.setItem("chatMessages", JSON.stringify(stored));
    setAllMessages(stored);
    setSettingsOpen(false);
    setAssistOpen(false);
    navigate("/closed");
  };

  const formatMessageTime = (msg) => {
    if (msg.time) return msg.time;

    if (msg.timestamp) {
      return new Date(msg.timestamp).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return "";
  };

  const mediaMessages = useMemo(() => {
    return messages
      .filter((msg) => msg.type === "image" || msg.type === "stamp")
      .slice()
      .reverse();
  }, [messages]);

  const fileMessages = useMemo(() => {
    return messages
      .filter((msg) => msg.type === "file")
      .slice()
      .reverse();
  }, [messages]);

  const linkMessages = useMemo(() => {
    const urlPattern = /(https?:\/\/[^\s]+)/g;

    return messages
      .filter((msg) => msg.type === "text" && urlPattern.test(msg.text || ""))
      .map((msg) => {
        const links = (msg.text || "").match(urlPattern) || [];
        return {
          ...msg,
          links,
        };
      })
      .reverse();
  }, [messages]);

  const renderAvatar = (name, avatarImage, fallbackText, className) => {
    if (avatarImage) {
      return (
        <img
          src={avatarImage}
          alt={name || "avatar"}
          className={`${className} avatar-image`}
        />
      );
    }

    return <span>{fallbackText}</span>;
  };

  return (
    <div className="chat-page">
      {assistOpen && (
        <>
          <div
            className="chat-assist-overlay"
            onClick={() => setAssistOpen(false)}
          />
          <aside className="chat-assist-panel">
            <div className="chat-assist-header">
              <h3>トークアシスト</h3>
              <button
                className="chat-icon-button"
                onClick={() => setAssistOpen(false)}
                aria-label="閉じる"
                title="閉じる"
              >
                ×
              </button>
            </div>

            <div className="chat-assist-body">
              <section className="chat-assist-section">
                <div className="chat-assist-section-head">
                  <h4>メディア</h4>
                  <button onClick={() => navigate(`/chat/${friendId}/media`)}>
                    一覧
                  </button>
                </div>

                <div className="chat-media-preview">
                  {mediaMessages.length > 0 ? (
                    mediaMessages.slice(0, 4).map((item) => (
                      <div key={item.id} className="chat-media-card">
                        {item.type === "stamp" ? (
                          item.text
                        ) : item.image ? (
                          <img
                            src={item.image}
                            alt={item.fileName || "メディア"}
                            className="chat-media-preview-image"
                          />
                        ) : (
                          "画像"
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="chat-assist-empty">まだメディアはありません</p>
                  )}
                </div>
              </section>

              <section className="chat-assist-section">
                <div className="chat-assist-section-head">
                  <h4>リンク</h4>
                  <button onClick={() => navigate(`/chat/${friendId}/links`)}>
                    一覧
                  </button>
                </div>

                <div className="chat-assist-list">
                  {linkMessages.length > 0 ? (
                    linkMessages.slice(0, 3).map((item) => (
                      <div key={item.id} className="chat-assist-list-card">
                        <p className="chat-assist-list-title">
                          {item.links[0]}
                        </p>
                        <span className="chat-assist-list-time">
                          {item.time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="chat-assist-empty">まだリンクはありません</p>
                  )}
                </div>
              </section>

              <section className="chat-assist-section">
                <div className="chat-assist-section-head">
                  <h4>ファイル</h4>
                  <button onClick={() => navigate(`/chat/${friendId}/files`)}>
                    一覧
                  </button>
                </div>

                <div className="chat-assist-list">
                  {fileMessages.length > 0 ? (
                    fileMessages.slice(0, 3).map((item) => (
                      <div key={item.id} className="chat-assist-list-card">
                        <p className="chat-assist-list-title">
                          {item.fileName || item.text || "ファイル"}
                        </p>
                        <span className="chat-assist-list-time">
                          {item.time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="chat-assist-empty">まだファイルはありません</p>
                  )}
                </div>
              </section>

              <section className="chat-assist-section">
                <div className="chat-assist-section-head">
                  <h4>アルバム</h4>
                  <button onClick={() => alert("アルバム一覧はこれから実装")}>
                    一覧
                  </button>
                </div>

                <div className="chat-media-preview">
                  <div className="chat-media-card muted">album</div>
                  <div className="chat-media-card muted">album</div>
                  <div className="chat-media-card muted">album</div>
                </div>
              </section>

              <section className="chat-assist-links">
                <button onClick={() => alert("アナウンスはこれから実装")}>
                  アナウンス
                </button>
                <button onClick={() => navigate(`/chat/${friendId}/links`)}>
                  リンク
                </button>
                <button onClick={() => navigate(`/chat/${friendId}/files`)}>
                  ファイル
                </button>
                <button onClick={() => setSettingsOpen(true)}>設定</button>
              </section>
            </div>
          </aside>
        </>
      )}

      {settingsOpen && (
        <>
          <div
            className="chat-assist-overlay"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="chat-settings-modal">
            <div className="chat-settings-header">
              <h3>設定</h3>
              <button
                className="chat-icon-button"
                onClick={() => setSettingsOpen(false)}
                aria-label="閉じる"
                title="閉じる"
              >
                ×
              </button>
            </div>

            <div className="chat-settings-body">
              <button onClick={() => alert("トーク保存はこれから実装")}>
                トーク保存
              </button>
              <button onClick={() => alert("ブロックはこれから実装")}>
                ブロック
              </button>
              <button className="danger" onClick={handleDeleteTalk}>
                トーク削除
              </button>
              <button onClick={() => alert("報告はこれから実装")}>
                報告
              </button>
            </div>
          </div>
        </>
      )}

      <header className="chat-header">
        <div className="chat-header-left">
          <button
            className="chat-icon-button"
            onClick={() => navigate(-1)}
            aria-label="戻る"
            title="戻る"
          >
            ←
          </button>

          <div className="chat-friend-avatar">
            {renderAvatar(
              friendInfo.name,
              friendInfo.avatarImage,
              friendInfo.avatar || friendInfo.name?.charAt(0) || "友",
              "chat-friend-avatar"
            )}
          </div>

          <div className="chat-friend-info">
            <p className="chat-friend-name">{friendInfo.name}</p>
          </div>
        </div>

        <div className="chat-header-right">
          <button
            className="chat-icon-button"
            onClick={() => alert("検索機能はこれから実装")}
            aria-label="検索"
            title="検索"
          >
            🔍
          </button>

          <button
            className="chat-icon-button"
            onClick={() => alert("音声通話は今後実装予定")}
            aria-label="電話"
            title="電話"
          >
            📞
          </button>

          <button
            className="chat-icon-button"
            onClick={() => setAssistOpen(true)}
            aria-label="メニュー"
            title="メニュー"
          >
            ☰
          </button>
        </div>
      </header>

      <main className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>まだメッセージはありません</p>
            <p>最初のひとことを送ってみよう</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine =
              String(msg.senderId ?? "") === String(currentAccount?.id ?? "");
            const prev = messages[index - 1];
            const isSameSender =
              prev &&
              String(prev.senderId ?? "") === String(msg.senderId ?? "");

            return (
              <div
                key={msg.id}
                className={`chat-message-row ${isMine ? "mine" : "friend"}`}
              >
                <div className={`chat-message-main ${isMine ? "mine" : "friend"}`}>
                  {!isMine && !isSameSender && (
                    <div className="chat-side-avatar">
                      {renderAvatar(
                        friendInfo.name,
                        friendInfo.avatarImage,
                        friendInfo.avatar || friendInfo.name?.charAt(0) || "友",
                        "chat-side-avatar"
                      )}
                    </div>
                  )}

                  {!isMine && isSameSender && (
                    <div className="chat-side-avatar empty" />
                  )}

                  <div className="chat-message-content">
                    <div
                      className={`chat-bubble ${isMine ? "mine" : "friend"} ${
                        msg.type === "stamp" ? "stamp-bubble" : ""
                      } ${msg.type === "image" ? "image-bubble" : ""}`}
                    >
                      {msg.type === "stamp" ? (
                        <span className="chat-stamp">{msg.text}</span>
                      ) : msg.type === "image" ? (
                        <img
                          src={msg.image}
                          alt={msg.fileName || "送信画像"}
                          className="chat-image"
                        />
                      ) : (
                        msg.text
                      )}
                    </div>

                    <div className={`chat-meta ${isMine ? "mine" : "friend"}`}>
                      <span className="chat-time">{formatMessageTime(msg)}</span>
                      {isMine && (
                        <span className="chat-read">
                          既読 {msg.readCount ?? 0}
                        </span>
                      )}
                    </div>
                  </div>

                  {isMine && !isSameSender && (
                    <div className="chat-side-avatar mine">
                      {renderAvatar(
                        currentAccount?.name,
                        currentAccount?.avatarImage,
                        currentAccount?.name?.charAt(0) || "自",
                        "chat-side-avatar"
                      )}
                    </div>
                  )}

                  {isMine && isSameSender && (
                    <div className="chat-side-avatar mine empty" />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="chat-footer">
        {attachOpen && (
          <div className="chat-attach-panel">
            <button onClick={() => alert("カメラはこれから実装")}>
              カメラ
            </button>
            <button onClick={() => imageInputRef.current?.click()}>
              メディア
            </button>
            <button onClick={() => alert("ファイルはこれから実装")}>
              ファイル
            </button>
          </div>
        )}

        <div className="chat-input-area">
          <button
            className="chat-plus-button"
            onClick={() => setAttachOpen((prev) => !prev)}
            aria-label="追加メニュー"
            title="追加メニュー"
          >
            ＋
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            className="chat-stamp-button"
            onClick={handleSendStamp}
            aria-label="スタンプ"
            title="スタンプ"
          >
            😊
          </button>

          <button
            className="chat-send-button"
            onClick={handleSend}
            aria-label="送信"
            title="送信"
          >
            送信
          </button>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleSendImage}
        />
      </footer>
    </div>
  );
}

export default Chat;