import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Open.css";
import OpenPostCard from "../components/OpenPostCard";

function formatTime(timestamp) {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return `${Math.floor(diff / 86400)}日前`;
}

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function Open({ currentAccount, setNotifications }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("recommended");
  const [allPostsByAccount, setAllPostsByAccount] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const stored = safeParse(localStorage.getItem("openPosts"), {});
    setAllPostsByAccount(stored);
  }, []);

  const allPosts = useMemo(() => {
    return Object.values(allPostsByAccount)
      .flat()
      .filter(Boolean)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [allPostsByAccount]);

  const followingPosts = useMemo(() => {
  if (!currentAccount?.id) return [];

  return allPosts
    .filter((post) => String(post.accountId) === String(currentAccount.id))
    .map((post) => {
      const likedUserIds = Array.isArray(post.likedUserIds)
        ? post.likedUserIds.map(String)
        : [];

      return {
        ...post,
        liked: likedUserIds.includes(String(currentAccount.id)),
        likeCount: likedUserIds.length,
      };
    });
 }, [allPosts, currentAccount]);

  const recommendedPosts = useMemo(() => {
  if (!currentAccount?.id) return allPosts;

  return allPosts.map((post) => {
    const likedUserIds = Array.isArray(post.likedUserIds)
      ? post.likedUserIds.map(String)
      : [];

    return {
      ...post,
      liked: likedUserIds.includes(String(currentAccount.id)),
      likeCount: likedUserIds.length,
    };
  });
 }, [allPosts, currentAccount]);

  const visiblePosts =
    activeTab === "following" ? followingPosts : recommendedPosts;

  const openMyPage = () => {
    navigate("/profile");
  };

  const openDmList = () => {
    navigate("/dm");
  };

  const toggleLike = (postId) => {
  if (!currentAccount?.id) return;

  let targetPost = null;
  let addedLike = false;

  const updated = Object.fromEntries(
    Object.entries(allPostsByAccount).map(([accountId, posts]) => {
      const nextPosts = posts.map((post) => {
        if (String(post.id) !== String(postId)) return post;

        const currentLikedUserIds = Array.isArray(post.likedUserIds)
          ? post.likedUserIds.map(String)
          : [];

        const myId = String(currentAccount.id);
        const alreadyLiked = currentLikedUserIds.includes(myId);

        const nextLikedUserIds = alreadyLiked
          ? currentLikedUserIds.filter((id) => id !== myId)
          : [...currentLikedUserIds, myId];

        addedLike = !alreadyLiked;

        targetPost = {
          ...post,
          likedUserIds: nextLikedUserIds,
          likeCount: nextLikedUserIds.length,
        };

        return targetPost;
      });

      return [accountId, nextPosts];
    })
  );

  setAllPostsByAccount(updated);
  localStorage.setItem("openPosts", JSON.stringify(updated));

  if (!targetPost) return;

  const myLikedKey = `likedPosts-${currentAccount.id}`;
  const likedPosts = safeParse(localStorage.getItem(myLikedKey), []);
  const exists = likedPosts.some((p) => String(p.id) === String(postId));

  const iLikedThisPost = (targetPost.likedUserIds || [])
    .map(String)
    .includes(String(currentAccount.id));

  if (iLikedThisPost && !exists) {
    localStorage.setItem(
      myLikedKey,
      JSON.stringify([targetPost, ...likedPosts])
    );
  }

  if (!iLikedThisPost && exists) {
    localStorage.setItem(
      myLikedKey,
      JSON.stringify(likedPosts.filter((p) => String(p.id) !== String(postId)))
    );
  }

  // 他人の投稿に新しくいいねした時だけ通知
  if (
    addedLike &&
    String(targetPost.accountId) !== String(currentAccount.id)
  ) {
    const currentNotifications = safeParse(
      localStorage.getItem("notifications"),
      []
    );

    const nextNotifications = [
      {
        id: Date.now(),
        accountId: targetPost.accountId,
        type: "like",
        from: currentAccount.name || "ユーザー",
        fromUser: currentAccount.name || "ユーザー",
        fromUserId: currentAccount.handle || `@${currentAccount.id}`,
        postId: targetPost.id,
        link: `/signal/${targetPost.id}`,
        read: false,
        isRead: false,
        createdAt: Date.now(),
      },
      ...currentNotifications,
    ].slice(0, 250);

    localStorage.setItem("notifications", JSON.stringify(nextNotifications));
    setNotifications(nextNotifications);
  }
};

  const toggleSave = (postId) => {
    const savedPosts = safeParse(localStorage.getItem("savedPosts"), []);
    let targetPost = null;

    const updated = Object.fromEntries(
      Object.entries(allPostsByAccount).map(([accountId, posts]) => {
        const nextPosts = posts.map((post) => {
          if (String(post.id) !== String(postId)) return post;

          const nextSaved = !post.saved;
          targetPost = {
            ...post,
            saved: nextSaved,
          };

          return targetPost;
        });

        return [accountId, nextPosts];
      })
    );

    setAllPostsByAccount(updated);
    localStorage.setItem("openPosts", JSON.stringify(updated));

    if (!targetPost) return;

    const exists = savedPosts.some((p) => String(p.id) === String(postId));

    if (targetPost.saved && !exists) {
      localStorage.setItem(
        "savedPosts",
        JSON.stringify([targetPost, ...savedPosts])
      );
    }

    if (!targetPost.saved && exists) {
      localStorage.setItem(
        "savedPosts",
        JSON.stringify(savedPosts.filter((p) => String(p.id) !== String(postId)))
      );
    }
  };

  const toggleResignal = (postId) => {
    if (!currentAccount) return;

    const ownerId = String(currentAccount.id);
    const stored = safeParse(localStorage.getItem("openPosts"), {});
    let targetPost = null;

    Object.values(stored)
      .flat()
      .forEach((post) => {
        if (String(post.id) === String(postId)) {
          targetPost = post;
        }
      });

    if (!targetPost) return;

    const myPosts = stored[ownerId] || [];

    const existingResignal = myPosts.find(
      (post) =>
        post.isResignal &&
        String(post.originalPost?.id) === String(postId)
    );

    let updated = { ...stored };

    if (existingResignal) {
      updated[ownerId] = myPosts.filter(
        (post) => String(post.id) !== String(existingResignal.id)
      );

      updated = Object.fromEntries(
        Object.entries(updated).map(([accountId, posts]) => [
          accountId,
          posts.map((post) => {
            if (String(post.id) !== String(postId)) return post;
            return {
              ...post,
              resignaled: false,
              resignalCount: Math.max(0, (post.resignalCount ?? 0) - 1),
            };
          }),
        ])
      );
    } else {
      const newResignal = {
        id: Date.now(),
        text: targetPost.text,
        timestamp: Date.now(),
        author: currentAccount.name || "名前未設定",
        accountId: currentAccount.id,
        handle: currentAccount.handle || `@${currentAccount.id}`,
        space: "open",
        tags: targetPost.tags || [],
        image: null,
        mediaName: null,
        recommendToOpen: true,
        likeCount: 0,
        liked: false,
        saved: false,
        replyCount: 0,
        resignalCount: 0,
        resignaled: false,
        isResignal: true,
        originalPost: {
          id: targetPost.id,
          author: targetPost.author,
          handle: targetPost.handle,
          text: targetPost.text,
          timestamp: targetPost.timestamp,
          tags: targetPost.tags || [],
          image: targetPost.image || null,
        },
      };

      updated[ownerId] = [newResignal, ...myPosts];


// リシグナル通知
if (String(targetPost.accountId) !== String(currentAccount?.id)) {

  const currentNotifications = safeParse(
    localStorage.getItem("notifications"),
    []
  );

  const nextNotifications = [
    {
      id: Date.now(),
      accountId: targetPost.accountId,
      type: "resignal",
      from: currentAccount?.name || "ユーザー",
      fromUser: currentAccount?.name || "ユーザー",
      fromUserId: currentAccount?.handle || `@${currentAccount?.id}`,
      postId: targetPost.id,
      link: `/signal/${targetPost.id}`,
      read: false,
      isRead: false,
      createdAt: Date.now(),
    },
    ...currentNotifications,
  ].slice(0, 250);

  localStorage.setItem("notifications", JSON.stringify(nextNotifications));
  setNotifications(nextNotifications);
}

      updated = Object.fromEntries(
        Object.entries(updated).map(([accountId, posts]) => [
          accountId,
          posts.map((post) => {
            if (String(post.id) !== String(postId)) return post;
            return {
              ...post,
              resignaled: true,
              resignalCount: (post.resignalCount ?? 0) + 1,
            };
          }),
        ])
      );
    }

    setAllPostsByAccount(updated);
    localStorage.setItem("openPosts", JSON.stringify(updated));
  };

  const handleDelete = (postId) => {
    const ok = window.confirm("このシグナルを削除する？");
    if (!ok) return;

    const updated = Object.fromEntries(
      Object.entries(allPostsByAccount).map(([accountId, posts]) => [
        accountId,
        posts.filter((post) => String(post.id) !== String(postId)),
      ])
    );

    setAllPostsByAccount(updated);
    localStorage.setItem("openPosts", JSON.stringify(updated));

    const likedPosts = safeParse(localStorage.getItem("likedPosts"), []).filter(
      (p) => String(p.id) !== String(postId)
    );
    const savedPosts = safeParse(localStorage.getItem("savedPosts"), []).filter(
      (p) => String(p.id) !== String(postId)
    );

    localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
    localStorage.setItem("savedPosts", JSON.stringify(savedPosts));
  };

  return (
    <div className="open-page">
      <header className="open-header">
        <button
          type="button"
          className="open-profileBtn"
          onClick={openMyPage}
          title="マイページ"
        >
          <span className="open-profileAvatar">
            {(currentAccount?.name || "?").charAt(0)}
          </span>
        </button>

        <h2 className="open-logo">ROAD3</h2>

        <div className="open-headerRight">
          <button
            type="button"
            className="open-iconBtn"
            onClick={openDmList}
            title="DM"
          >
            ✉️
          </button>

          <div className="open-menuWrap">
            <button
              type="button"
              className="open-iconBtn"
              onClick={() => setIsMenuOpen((v) => !v)}
              title="メニュー"
            >
              ⋯
            </button>

            {isMenuOpen && (
              <div className="open-menuDropdown">
                <button
                  type="button"
                  className="open-menuItem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/activity/signals");
                  }}
                >
                  自分のシグナル
                </button>

                <button
                  type="button"
                  className="open-menuItem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/activity/saved");
                  }}
                >
                  保存・いいね確認
                </button>

                <button
                  type="button"
                  className="open-menuItem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/activity/notifications");
                  }}
                >
                  通知確認
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="open-tabs">
        <button
          type="button"
          className={`open-tab ${activeTab === "recommended" ? "active" : ""}`}
          onClick={() => setActiveTab("recommended")}
        >
          おすすめ
        </button>

        <button
          type="button"
          className={`open-tab ${activeTab === "following" ? "active" : ""}`}
          onClick={() => setActiveTab("following")}
        >
          フォロー
        </button>
      </div>

      <main className="open-posts">
        {visiblePosts.length === 0 ? (
          <div className="open-empty">
            {activeTab === "following"
              ? "フォローのシグナルはまだありません。"
              : "おすすめのシグナルはまだありません。"}
          </div>
        ) : (
          visiblePosts.map((post) => (
            <OpenPostCard
              key={post.id}
              post={post}
              formatTime={formatTime}
              onToggleLike={toggleLike}
              onToggleSave={toggleSave}
              onToggleResignal={toggleResignal}
              onDelete={handleDelete}
            />
          ))
        )}
      </main>

      <button
        className="floating-button"
        onClick={() => navigate("/posts")}
        type="button"
        title="投稿する"
      >
        ＋
      </button>
    </div>
  );
}

export default Open;