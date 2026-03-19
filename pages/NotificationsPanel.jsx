import { useEffect, useMemo, useState } from "react";
import "./NotificationsPanel.css";

export default function NotificationsPanel({
  notifications,
  setNotifications,
  accounts,
}) {
  // "all" or accountId(string)
  const [filter, setFilter] = useState("all");

  // アカウントタブ用
  const accountTabs = useMemo(() => {
    const list = accounts || [];
    return [{ id: "all", name: "全アカウント" }, ...list.map((a) => ({
      id: String(a.id),
      name: a.name,
    }))];
  }, [accounts]);

  // 既読判定は isRead に統一（readが来ても救済する）
  const norm = (n) => ({
    ...n,
    isRead: typeof n.isRead === "boolean" ? n.isRead : !!n.read,
    accountId: n.accountId != null ? String(n.accountId) : "unknown",
  });

  const list = useMemo(() => {
    const base = (notifications || []).map(norm);

    const filtered =
      filter === "all" ? base : base.filter((n) => n.accountId === filter);

    // 新しい順（createdAtがあればそれで、無ければid）
    return filtered.sort((a, b) => {
      const ta = a.createdAt ?? 0;
      const tb = b.createdAt ?? 0;
      return tb - ta;
    });
  }, [notifications, filter]);

  // 表示中の通知は「開いた時点で既読」にする（あなたの設計に合う）
  useEffect(() => {
    if (!setNotifications) return;

    const targetIds = new Set(list.filter((n) => !n.isRead).map((n) => n.id));
    if (targetIds.size === 0) return;

    setNotifications((prev) =>
      (prev || []).map((n) => {
        const isRead =
          typeof n.isRead === "boolean" ? n.isRead : !!n.read;

        if (!targetIds.has(n.id)) return n;

        // isRead に統一して保存
        const next = { ...n, isRead: true };
        // 互換のためreadも合わせてtrueにしておく（消してもOK）
        next.read = true;
        return next;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, list.length]);

  const markAllRead = () => {
    setNotifications((prev) =>
      (prev || []).map((n) => {
        const acc = n.accountId != null ? String(n.accountId) : "unknown";
        if (filter !== "all" && acc !== filter) return n;
        return { ...n, isRead: true, read: true };
      })
    );
  };

  return (
    <div className="np-wrap">
      <div className="np-tabs">
        {accountTabs.map((t) => (
          <button
            key={t.id}
            className={`np-tab ${String(filter) === String(t.id) ? "active" : ""}`}
            onClick={() => setFilter(String(t.id))}
            type="button"
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="np-actions">
        <button className="np-markAll" type="button" onClick={markAllRead}>
          全て既読
        </button>
      </div>

      {list.length === 0 ? (
        <div className="np-empty">通知はありません</div>
      ) : (
        <div className="np-list">
          {list.map((n) => (
            <div
              key={n.id}
              className={`np-item ${n.isRead ? "read" : "unread"}`}
              onClick={() => console.log("遷移予定:", n)}
              role="button"
              tabIndex={0}
            >
              <div className="np-msg">{n.message}</div>
              {n.createdAt && (
                <div className="np-time">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}