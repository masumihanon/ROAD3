import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./OtherProfile.css";
import PostCard from "../components/PostCard";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function OtherProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentAccount = useMemo(() => {
    return safeParse(localStorage.getItem("currentAccount"), null);
  }, []);

  const rawUser = location.state?.user || {
    id: "sample_user",
    name: "ユーザー名",
    userId: "@sample_user",
    bio: "ここに自己紹介文が入ります。",
    following: 120,
    followers: 245,
    place: "居場所（あれば）",
    links: ["リンク1", "リンク2"],
    birthday: "誕生日（あれば）",
    joined: "ROAD3 利用開始日",
    tags: ["#AI", "#教育", "#エネルギー"],
  };

  // user.id が無い場合も安定するよう補完
  const user = {
    ...rawUser,
    id:
      rawUser.id ??
      String(rawUser.userId || "").replace(/^@/, "") ??
      "unknown_user",
  };

  const initialPosts = location.state?.posts || {
    signal: [],
    reply: [],
    media: [],
    video: [],
  };

  const [activeTab, setActiveTab] = useState("signal");
  const [showMenu, setShowMenu] = useState(false);
  const [signalOn, setSignalOn] = useState(true);

  const followKey = currentAccount
    ? `follow-${currentAccount.id}-${user.id}`
    : null;

  const followerStorageKey = `followers-count-${user.id}`;

  const [isFollowing, setIsFollowing] = useState(() => {
    if (!followKey) return false;
    return localStorage.getItem(followKey) === "true";
  });

  const [followerCount, setFollowerCount] = useState(() => {
    const saved = localStorage.getItem(followerStorageKey);
    if (saved !== null) return Number(saved);
    return user.followers ?? 0;
  });

  const tabs = [
    { key: "signal", label: "シグナル" },
    { key: "reply", label: "返信" },
    { key: "media", label: "メディア" },
    { key: "video", label: "動画" },
  ];

 const handleToggleFollow = () => {
  if (!currentAccount) return;

  const nextFollowing = !isFollowing;
  const nextFollowerCount = nextFollowing
    ? followerCount + 1
    : Math.max(0, followerCount - 1);

  setIsFollowing(nextFollowing);
  setFollowerCount(nextFollowerCount);

  if (followKey) {
    localStorage.setItem(followKey, String(nextFollowing));
  }
  localStorage.setItem(followerStorageKey, String(nextFollowerCount));

  const myFollowingKey = `followingList-${currentAccount.id}`;
  const targetFollowersKey = `followersList-${user.id}`;

  const currentFollowingList = safeParse(
    localStorage.getItem(myFollowingKey),
    []
  );
  const currentFollowersList = safeParse(
    localStorage.getItem(targetFollowersKey),
    []
  );

  const followUserData = {
    id: user.id,
    name: user.name,
    userId: user.userId,
    bio: user.bio || "自己紹介はまだありません。",
    following: user.following ?? 0,
    followers: nextFollowerCount,
    place: user.place || "未設定",
    links: user.links || [],
    birthday: user.birthday || "非公開",
    joined: user.joined || "ROAD3利用開始日",
    tags: user.tags || [],
  };

  const meData = {
    id: currentAccount.id,
    name: currentAccount.name || "ユーザー",
    userId: currentAccount.handle || `@${currentAccount.id}`,
  };

  if (nextFollowing) {
    const nextFollowingList = currentFollowingList.some(
      (item) => String(item.id) === String(user.id)
    )
      ? currentFollowingList
      : [followUserData, ...currentFollowingList];

    const nextFollowersList = currentFollowersList.some(
      (item) => String(item.id) === String(currentAccount.id)
    )
      ? currentFollowersList
      : [meData, ...currentFollowersList];

    localStorage.setItem(myFollowingKey, JSON.stringify(nextFollowingList));
    localStorage.setItem(targetFollowersKey, JSON.stringify(nextFollowersList));
  } else {
    const nextFollowingList = currentFollowingList.filter(
      (item) => String(item.id) !== String(user.id)
    );
    const nextFollowersList = currentFollowersList.filter(
      (item) => String(item.id) !== String(currentAccount.id)
    );

    localStorage.setItem(myFollowingKey, JSON.stringify(nextFollowingList));
    localStorage.setItem(targetFollowersKey, JSON.stringify(nextFollowersList));
  }

  if (nextFollowing && String(currentAccount.id) !== String(user.id)) {
    const currentNotifications = safeParse(
      localStorage.getItem("notifications"),
      []
    );

    const nextNotifications = [
      {
        id: Date.now(),
        accountId: user.id,
        type: "follow",
        from: currentAccount.name || "ユーザー",
        fromUser: currentAccount.name || "ユーザー",
        fromUserId: currentAccount.handle || `@${currentAccount.id}`,
        link: `/profile/user/${encodeURIComponent(currentAccount.id)}`,
        read: false,
        isRead: false,
        createdAt: Date.now(),
      },
      ...currentNotifications,
    ].slice(0, 250);

    localStorage.setItem("notifications", JSON.stringify(nextNotifications));
  }
};

  const handleOpenDM = () => {
    const savedChats = JSON.parse(localStorage.getItem("dmChats") || "[]");

    const targetId = String(user.userId);
    const existingChat = savedChats.find(
      (chat) => String(chat.userId) === targetId
    );

    if (existingChat) {
      navigate(`/dm/chat/${encodeURIComponent(existingChat.userId)}`, {
        state: { chat: existingChat },
      });
      return;
    }

    const newChat = {
      userId: user.userId,
      name: user.name,
      handle: user.userId,
      time: "",
      lastMessage: "",
      unread: 0,
      updatedAt: Date.now(),
      messages: [],
    };

    const updatedChats = [newChat, ...savedChats];
    localStorage.setItem("dmChats", JSON.stringify(updatedChats));

    navigate(`/dm/chat/${encodeURIComponent(newChat.userId)}`, {
      state: { chat: newChat },
    });
  };

  return (
    <div className="other-profile-page">
      <div className="other-profile-container">
        <header className="profile-header-area">
          <button className="icon-button" onClick={() => navigate(-1)}>
            ←
          </button>

          <div className="header-actions">
            <button className="icon-button" onClick={handleOpenDM}>
              ✉
            </button>

            <button
              className="icon-button"
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋯
            </button>
          </div>

          {showMenu && (
            <div className="profile-menu-popup">
              <button className="menu-item">プロフィールを共有</button>

              <button
                className="menu-item"
                onClick={() => setSignalOn(!signalOn)}
              >
                シグナル通知 {signalOn ? "OFFにする" : "ONにする"}
              </button>

              <button className="menu-item">ミュート</button>

              <div className="menu-divider"></div>

              <button className="menu-item danger">ブロック</button>
              <button className="menu-item danger">報告</button>
            </div>
          )}
        </header>

        <div className="profile-banner"></div>

        <section className="profile-main">
          <div className="profile-top-row">
            <div className="profile-icon">
              {(user.name || "?").charAt(0)}
            </div>

            <div className="profile-main-actions">
              <button
                className={`follow-button ${isFollowing ? "following" : ""}`}
                onClick={handleToggleFollow}
              >
                {isFollowing ? "フォロー中" : "フォロー"}
              </button>
            </div>
          </div>

          <div className="profile-basic-info">
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-id">{user.userId}</p>
            <p className="profile-bio">{user.bio}</p>
          </div>

          <div className="profile-follow-info">
            <span>
              <strong>{user.following}</strong> フォロー
            </span>
            <span>
              <strong>{followerCount}</strong> フォロワー
            </span>
          </div>

          <div className="profile-detail-list">
            <p>📍 {user.place}</p>
            <p>
              🔗 {user.links && user.links.length > 0 ? user.links.join(" / ") : "未設定"}
            </p>
            <p>🎂 {user.birthday}</p>
            <p>📅 {user.joined}</p>
          </div>

          <div className="profile-tags">
            <p className="section-label">よく使うタグ</p>
            <div className="tag-list">
              {user.tags && user.tags.length > 0 ? (
                user.tags.map((tag, index) => (
                  <span className="tag" key={index}>
                    {tag}
                  </span>
                ))
              ) : (
                <span className="tag">#Now</span>
              )}
            </div>
          </div>
        </section>

        <section className="profile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </section>

        <section className="profile-post-list">
          {(initialPosts[activeTab] || []).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      </div>
    </div>
  );
}

export default OtherProfile;