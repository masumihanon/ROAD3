import { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Notifications.css";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function formatTime(timestamp) {
  if (!timestamp) return "";

  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  return `${diffDay}日前`;
}

function Notifications({ notifications, setNotifications, currentAccount }) {
  const navigate = useNavigate();
  const location = useLocation();

  const backPath = location.state?.from || "/personal";

  const myNotifications = useMemo(() => {
    if (!currentAccount) return [];

    return [...notifications]
      .filter((n) => String(n.accountId) === String(currentAccount.id))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 250);
  }, [notifications, currentAccount]);

  useEffect(() => {
    if (!currentAccount) return;

    const hasUnread = notifications.some(
      (n) => String(n.accountId) === String(currentAccount.id) && !n.read
    );

    if (!hasUnread) return;

    const updated = notifications.map((n) =>
      String(n.accountId) === String(currentAccount.id)
        ? { ...n, read: true, isRead: true }
        : n
    );

    setNotifications(updated);
  }, [notifications, currentAccount, setNotifications]);

  const groupedNotifications = useMemo(() => {
    const groups = [];

    myNotifications.forEach((n) => {
      const canGroup = n.type === "like" || n.type === "resignal";

      if (!canGroup) {
        groups.push({
          id: n.id,
          type: n.type,
          users: [n.from || n.fromUser || n.accountName || "ユーザー"],
          count: 1,
          createdAt: n.createdAt,
          read: n.read,
          link: n.link,
          postId: n.postId,
          fromUserId: n.fromUserId || "",
          raw: [n],
        });
        return;
      }

      const existing = groups.find(
        (g) =>
          g.type === n.type &&
          String(g.postId || "") === String(n.postId || "") &&
          String(g.link || "") === String(n.link || "")
      );

      if (existing) {
        const userName = n.from || n.fromUser || n.accountName || "ユーザー";
        if (!existing.users.includes(userName)) {
          existing.users.push(userName);
        }
        existing.count += 1;
        existing.createdAt = Math.max(existing.createdAt || 0, n.createdAt || 0);
        existing.read = existing.read && n.read;
        existing.raw.push(n);
      } else {
        groups.push({
          id: n.id,
          type: n.type,
          users: [n.from || n.fromUser || n.accountName || "ユーザー"],
          count: 1,
          createdAt: n.createdAt,
          read: n.read,
          link: n.link,
          postId: n.postId,
          fromUserId: n.fromUserId || "",
          raw: [n],
        });
      }
    });

    return groups.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [myNotifications]);

  const getIcon = (type) => {
    switch (type) {
      case "like":
        return "❤️";
      case "resignal":
        return "🔁";
      case "quote":
      case "quote-resignal":
        return "✍️";
      case "follow":
        return "👤";
      case "reply":
        return "💬";
      case "signal":
        return "📣";
      default:
        return "🔔";
    }
  };

  const getIconClass = (type) => {
    switch (type) {
      case "like":
        return "like";
      case "resignal":
        return "resignal";
      case "quote":
      case "quote-resignal":
        return "quote";
      case "follow":
        return "follow";
      case "reply":
        return "reply";
      case "signal":
        return "signal";
      default:
        return "default";
    }
  };

  const getMessage = (item) => {
    const first = item.users[0] || "ユーザー";
    const second = item.users[1];
    const others = item.count - (second ? 2 : 1);

    const joinedNames = second
      ? `${first}さん、${second}さん${others > 0 ? ` 他${others}名` : ""}`
      : `${first}さん${others > 0 ? ` 他${others}名` : ""}`;

    switch (item.type) {
      case "like":
        return `${joinedNames}がいいねしました`;
      case "resignal":
        return `${joinedNames}にリシグナルされました`;
      case "quote":
      case "quote-resignal":
        return `${first}さんが引用リシグナルしました`;
      case "follow":
        return `${first}さんにフォローされました`;
      case "reply":
        return `${first}さんが返信しました`;
      case "signal":
        return `${first}さんがSignalを投稿しました`;
      default:
        return "通知があります";
    }
  };

  const findPostById = (postId) => {
    const openPosts = safeParse(localStorage.getItem("openPosts"), {});
    const groupPosts = safeParse(localStorage.getItem("groupPosts"), {});
    const closedPosts = safeParse(localStorage.getItem("closedPosts"), {});

    const allPosts = [
      ...Object.values(openPosts).flat(),
      ...Object.values(groupPosts).flat(),
      ...Object.values(closedPosts).flat(),
    ].filter(Boolean);

    return allPosts.find((post) => String(post.id) === String(postId)) || null;
  };

  const handleOpenNotification = (item) => {
    if (item.type === "follow") {
      if (item.fromUserId) {
        const normalizedId = String(item.fromUserId).replace(/^@/, "");
        navigate(`/profile/user/${encodeURIComponent(normalizedId)}`, {
          state: { from: backPath },
        });
        return;
      }

      if (item.link) {
        navigate(item.link, { state: { from: backPath } });
        return;
      }

      navigate("/profile/follow?tab=followers", {
        state: { from: backPath },
      });
      return;
    }

    if (item.postId) {
      const originalPost = findPostById(item.postId);

      if (originalPost) {
        const current = safeParse(localStorage.getItem("currentAccount"), null);
        const isMine =
          String(current?.id || "") === String(originalPost.accountId || "");

        navigate(`/signal/${item.postId}`, {
          state: {
            from: backPath,
            post: {
              id: originalPost.id,
              name: originalPost.author || "ユーザー名",
              userId: originalPost.handle || `@${originalPost.accountId}`,
              time: formatTime(originalPost.timestamp),
              content: originalPost.text || "",
              comments: originalPost.commentCount ?? 0,
              resignals: isMine ? originalPost.resignalCount ?? 0 : null,
              likes: isMine ? originalPost.likeCount ?? 0 : null,
              level: 0,
              isMine,
              bio: originalPost.bio || "",
              following: originalPost.following ?? 0,
              followers: originalPost.followers ?? 0,
              place: originalPost.place || "",
              links: originalPost.links || [],
              birthday: originalPost.birthday || "",
              joined: originalPost.joined || "",
              tags: originalPost.tags || [],
              image: originalPost.image || null,
              isResignal: originalPost.isResignal || false,
              isQuoteResignal: originalPost.isQuoteResignal || false,
              originalPost: originalPost.originalPost || null,
              accountId: originalPost.accountId,
              likeCount: isMine ? originalPost.likeCount ?? 0 : null,
            },
          },
        });
        return;
      }

      navigate(`/signal/${item.postId}`, {
        state: { from: backPath },
      });
      return;
    }

    if (item.link) {
      navigate(item.link, { state: { from: backPath } });
      return;
    }

    navigate("/open", { state: { from: backPath } });
  };

  if (!currentAccount) {
    return <div className="notifications-page">読み込み中...</div>;
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <button
          type="button"
          className="notifications-back"
          onClick={() => navigate(backPath)}
        >
          ←
        </button>

        <h2 className="notifications-title">通知</h2>

        <div className="notifications-badgeWrap">
          {myNotifications.some((n) => !n.read) && (
            <span className="notifications-badge">新</span>
          )}
        </div>
      </div>

      <div className="notifications-list">
        {groupedNotifications.length === 0 ? (
          <p className="notifications-empty">通知はありません</p>
        ) : (
          groupedNotifications.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className={`notifications-card ${item.read ? "read" : "unread"}`}
              onClick={() => handleOpenNotification(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleOpenNotification(item);
                }
              }}
            >
              <div
                className={`notifications-cardIcon ${getIconClass(item.type)}`}
              >
                {getIcon(item.type)}
              </div>

              <div className="notifications-cardBody">
                <p className="notifications-cardText">{getMessage(item)}</p>
                <span className="notifications-cardTime">
                  {formatTime(item.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;