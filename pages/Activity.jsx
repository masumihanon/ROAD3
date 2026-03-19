import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Activity.css";

function getTabFromPath(pathname) {
  if (pathname.startsWith("/activity/signals")) return "signals";
  if (pathname.startsWith("/activity/saved")) return "saved";
  return "notifications";
}

function safeJsonParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function collectAllPosts() {
  const open = safeJsonParse(localStorage.getItem("openPosts"), {});
  const group = safeJsonParse(localStorage.getItem("groupPosts"), {});
  const closed = safeJsonParse(localStorage.getItem("closedPosts"), {});

  const all = [
    ...Object.values(open).flat(),
    ...Object.values(group).flat(),
    ...Object.values(closed).flat(),
  ];

  return all
    .filter(Boolean)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function formatTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function Activity({
  accounts = [],
  currentAccount,
  notifications = [],
  setNotifications,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const backPath = location.state?.from || "/personal";
  const tab = getTabFromPath(location.pathname);
  const [accountFilter, setAccountFilter] = useState("all");

  const title =
    tab === "signals"
      ? "シグナル確認"
      : tab === "saved"
      ? "保存・いいね確認"
      : "通知";

  const accountTabs = useMemo(() => {
    return [
      { id: "all", name: "全アカウント" },
      ...accounts.map((acc) => ({
        id: String(acc.id),
        name: acc.name || "名称未設定",
      })),
    ];
  }, [accounts]);

  const allPosts = useMemo(() => collectAllPosts(), []);

  const signalItems = useMemo(() => {
    const mine = allPosts.filter((post) => {
      const authorId = String(post.accountId ?? "");
      if (accountFilter === "all") {
        return accounts.some((acc) => String(acc.id) === authorId);
      }
      return authorId === accountFilter;
    });

    return mine.map((post) => ({
      id: post.id,
      title: post.author || "名前未設定",
      handle: post.handle || "@---",
      text: post.text || "本文なし",
      image: post.image || null,
      time: post.timestamp,
      raw: post,
    }));
  }, [allPosts, accounts, accountFilter]);

  const savedItems = useMemo(() => {
    const savedPosts = safeJsonParse(localStorage.getItem("savedPosts"), []);
    const likedPosts = safeJsonParse(localStorage.getItem("likedPosts"), []);

    const mergedMap = new Map();

    savedPosts.forEach((post) => {
      if (!post?.id) return;
      mergedMap.set(String(post.id), {
        id: post.id,
        title: post.author || "名前未設定",
        handle: post.handle || "@---",
        text: post.text || "本文なし",
        image: post.image || null,
        time: post.timestamp,
        liked: false,
        bookmarked: true,
        accountId: String(post.accountId ?? ""),
        raw: post,
      });
    });

    likedPosts.forEach((post) => {
      if (!post?.id) return;
      const key = String(post.id);

      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        mergedMap.set(key, {
          ...existing,
          liked: true,
        });
      } else {
        mergedMap.set(key, {
          id: post.id,
          title: post.author || "名前未設定",
          handle: post.handle || "@---",
          text: post.text || "本文なし",
          image: post.image || null,
          time: post.timestamp,
          liked: true,
          bookmarked: false,
          accountId: String(post.accountId ?? ""),
          raw: post,
        });
      }
    });

    let items = Array.from(mergedMap.values());

    if (accountFilter !== "all") {
      items = items.filter((item) => item.accountId === accountFilter);
    }

    return items.sort((a, b) => (b.time || 0) - (a.time || 0));
  }, [accountFilter]);

  const notificationItems = useMemo(() => {
    const normalized = (notifications || []).map((n) => ({
      ...n,
      isRead: typeof n.isRead === "boolean" ? n.isRead : !!n.read,
      accountId: String(n.accountId ?? ""),
    }));

    const filtered =
      accountFilter === "all"
        ? normalized
        : normalized.filter((n) => n.accountId === accountFilter);

    return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [notifications, accountFilter]);

  const markAllRead = () => {
    if (!setNotifications) return;

    setNotifications((prev) =>
      (prev || []).map((n) => {
        const accId = String(n.accountId ?? "");
        if (accountFilter !== "all" && accId !== accountFilter) return n;
        return { ...n, isRead: true, read: true };
      })
    );
  };

  return (
    <div className="activity-page">
      <div className="activity-topbar">
        <button
          type="button"
          className="activity-back"
          onClick={() => navigate(backPath)}
        >
          ← 戻る
        </button>

        <h2 className="activity-title">{title}</h2>

        <div className="activity-topbar-right">
          {tab === "notifications" && (
            <button
              type="button"
              className="activity-smallBtn"
              onClick={markAllRead}
            >
              全て既読
            </button>
          )}
        </div>
      </div>

      <div className="activity-filterRow">
        <div className="activity-chipScroll">
          {accountTabs.map((acc) => (
            <button
              key={acc.id}
              type="button"
              className={`activity-chip ${
                accountFilter === acc.id ? "active" : ""
              }`}
              onClick={() => setAccountFilter(acc.id)}
            >
              {acc.name}
            </button>
          ))}
        </div>
      </div>

      <div className="activity-content">
        {tab === "signals" && (
          <>
            {signalItems.length === 0 ? (
              <div className="activity-empty">
                表示できるシグナルがまだありません。
              </div>
            ) : (
              signalItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="activity-card signal-card"
                  onClick={() =>
                    navigate(`/posts/${item.id}`, {
                      state: { from: location.pathname, fromRoot: backPath },
                    })
                  }
                >
                  <div className="activity-cardHead">
                    <div className="activity-avatar">
                      {(item.title || "?").charAt(0)}
                    </div>
                    <div className="activity-cardMeta">
                      <strong>{item.title}</strong>
                      <span>{item.handle}</span>
                    </div>
                    <div className="activity-time">{formatTime(item.time)}</div>
                  </div>

                  <div className="activity-cardBody">
                    <p>{item.text}</p>
                    {item.image && (
                      <div className="activity-imageBox">画像あり</div>
                    )}
                  </div>

                  <div className="activity-cardFoot">
                    <span>シグナル</span>
                    <span>開く</span>
                  </div>
                </button>
              ))
            )}
          </>
        )}

        {tab === "saved" && (
          <>
            {savedItems.length === 0 ? (
              <div className="activity-empty">
                保存・いいねしたものはまだありません。
              </div>
            ) : (
              savedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="activity-card saved-card"
                  onClick={() =>
                    navigate(`/posts/${item.id}`, {
                      state: { from: location.pathname, fromRoot: backPath },
                    })
                  }
                >
                  <div className="activity-cardHead">
                    <div className="activity-avatar">
                      {(item.title || "?").charAt(0)}
                    </div>
                    <div className="activity-cardMeta">
                      <strong>{item.title}</strong>
                      <span>{item.handle}</span>
                    </div>
                    <div className="activity-time">{formatTime(item.time)}</div>
                  </div>

                  <div className="activity-cardBody">
                    <p>{item.text}</p>
                    {item.image && (
                      <div className="activity-imageBox">画像あり</div>
                    )}
                  </div>

                  <div className="activity-cardFoot">
                    <span>
                      {item.bookmarked ? "保存" : ""}
                      {item.bookmarked && item.liked ? " / " : ""}
                      {item.liked ? "いいね" : ""}
                    </span>
                    <span>開く</span>
                  </div>
                </button>
              ))
            )}
          </>
        )}

        {tab === "notifications" && (
          <>
            {notificationItems.length === 0 ? (
              <div className="activity-empty">通知はありません。</div>
            ) : (
              notificationItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`activity-card notification-card ${
                    item.isRead ? "read" : "unread"
                  }`}
                  onClick={() => console.log("通知クリック:", item)}
                >
                  <div className="activity-cardHead">
                    <div className="activity-avatar">
                      {(item.message || "通").charAt(0)}
                    </div>
                    <div className="activity-cardMeta">
                      <strong>通知</strong>
                      <span>{item.accountName || "アカウント"}</span>
                    </div>
                    <div className="activity-time">
                      {formatTime(item.createdAt)}
                    </div>
                  </div>

                  <div className="activity-cardBody">
                    <p>{item.message || "通知があります。"}</p>
                  </div>

                  <div className="activity-cardFoot">
                    <span>{item.isRead ? "既読" : "未読"}</span>
                    <span>詳細</span>
                  </div>
                </button>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}