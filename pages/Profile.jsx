import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function collectAllPosts() {
  const open = safeParse(localStorage.getItem("openPosts"), {});
  const group = safeParse(localStorage.getItem("groupPosts"), {});
  const closed = safeParse(localStorage.getItem("closedPosts"), {});

  return [
    ...Object.values(open).flat(),
    ...Object.values(group).flat(),
    ...Object.values(closed).flat(),
  ].filter(Boolean);
}

function formatJoinedDate(value) {
  if (!value) return "未設定";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("signals");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentAccount = JSON.parse(
    localStorage.getItem("currentAccount") || "null"
  );
  const currentId = String(currentAccount?.id || "");

  const followingCount = JSON.parse(
    localStorage.getItem(`followingList-${currentId}`) || "[]"
  ).length;

  const followerCount = JSON.parse(
    localStorage.getItem(`followersList-${currentId}`) || "[]"
  ).length;

  const profileSettings = useMemo(
    () => safeParse(localStorage.getItem("profileSettings"), {}),
    []
  );

  const allPosts = useMemo(() => collectAllPosts(), []);

  const myPosts = useMemo(() => {
    if (!currentAccount?.id) return [];
    return allPosts
      .filter((post) => String(post.accountId) === String(currentAccount.id))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [allPosts, currentAccount]);

  const replyPosts = useMemo(() => {
    return myPosts.filter((post) => post.isReply);
  }, [myPosts]);

  const mediaPosts = useMemo(() => {
    return myPosts.filter((post) => post.image && !post.video);
  }, [myPosts]);

  const videoPosts = useMemo(() => {
    return myPosts.filter((post) => post.video);
  }, [myPosts]);

  
const likedPosts = useMemo(() => {
  const liked = safeParse(
    localStorage.getItem(`likedPosts-${currentId}`),
    []
   );
   return liked.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [currentId]);

  const savedPosts = useMemo(() => {
    const saved = safeParse(localStorage.getItem("savedPosts"), []);
    return saved.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, []);

  const profile = useMemo(() => {
    const byAccount = profileSettings?.[currentAccount?.id] || {};

    return {
      displayName: currentAccount?.name || "名前未設定",
      handle: currentAccount?.handle || `@${currentAccount?.id || "---"}`,
      bio: byAccount.bio || "自己紹介はまだありません。",
      place: byAccount.place || "未設定",
      birthday: byAccount.birthday || "未設定",
      birthdayVisibility: byAccount.birthdayVisibility || "非公開",
      joinedAt: byAccount.joinedAt || currentAccount?.createdAt || Date.now(),
      links: Array.isArray(byAccount.links)
        ? byAccount.links.filter(Boolean).slice(0, 3)
        : [],
      favoriteTags: Array.isArray(byAccount.favoriteTags)
        ? byAccount.favoriteTags.slice(0, 5)
        : [],
      showFollowCounts:
        typeof byAccount.showFollowCounts === "boolean"
          ? byAccount.showFollowCounts
          : true,
      headerImage: byAccount.headerImage || "",
      avatarImage: byAccount.avatarImage || "",
      pinnedPostId: byAccount.pinnedPostId || null,
      isPrivate: !!byAccount.isPrivate,
    };
  }, [profileSettings, currentAccount]);

  const pinnedPost = useMemo(() => {
    if (!profile.pinnedPostId) return null;
    return (
      myPosts.find((post) => String(post.id) === String(profile.pinnedPostId)) ||
      null
    );
  }, [profile, myPosts]);

  const currentTabItems = useMemo(() => {
    switch (activeTab) {
      case "signals":
        return myPosts;
      case "replies":
        return replyPosts;
      case "media":
        return mediaPosts;
      case "videos":
        return videoPosts;
      case "likes":
        return likedPosts;
      case "saved":
        return savedPosts;
      default:
        return myPosts;
    }
  }, [
    activeTab,
    myPosts,
    replyPosts,
    mediaPosts,
    videoPosts,
    likedPosts,
    savedPosts,
  ]);

  const tabLabelMap = {
    signals: "シグナル",
    replies: "返信",
    media: "メディア",
    videos: "動画",
    likes: "いいね",
    saved: "保存",
  };

  if (!currentAccount) {
    return (
      <div className="profile-page">
        <div className="profile-topbar">
          <button
            type="button"
            className="profile-back"
            onClick={() => navigate(-1)}
          >
            ← 戻る
          </button>
          <h2 className="profile-title">プロフィール</h2>
          <div className="profile-topbarRight" />
        </div>

        <div className="profile-emptyWrap">
          <div className="profile-emptyCard">
            アカウント情報が見つかりません。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button
          type="button"
          className="profile-back"
          onClick={() => navigate(-1)}
        >
          ← 戻る
        </button>

        <h2 className="profile-title">プロフィール</h2>

        <div className="profile-topbarRight">
          <button
            type="button"
            className="profile-topAction"
            onClick={() => navigate("/profile/edit")}
          >
            編集
          </button>

          <button
            type="button"
            className="profile-topAction"
            onClick={() => setIsSettingsOpen(true)}
          >
            ⚙
          </button>
        </div>
      </div>

      <div className="profile-content">
        <section className="profile-card">
          <div className="profile-headerVisual">
            {profile.headerImage ? (
              <img
                src={profile.headerImage}
                alt="ヘッダー"
                className="profile-headerImage"
              />
            ) : (
              <div className="profile-headerPlaceholder" />
            )}
          </div>

          <div className="profile-mainBlock">
            <div className="profile-avatarWrap">
              {profile.avatarImage ? (
                <img
                  src={profile.avatarImage}
                  alt="アイコン"
                  className="profile-avatarImage"
                />
              ) : (
                <div className="profile-avatar">
                  {(profile.displayName || "?").charAt(0)}
                </div>
              )}
            </div>

            <div className="profile-nameArea">
              <h1 className="profile-name">{profile.displayName}</h1>
              <div className="profile-handle">{profile.handle}</div>
            </div>

            <div className="profile-bio">{profile.bio}</div>

            <div className="profile-infoList">
              <div className="profile-infoItem">
                <span className="profile-infoLabel">居場所</span>
                <span className="profile-infoValue">{profile.place}</span>
              </div>

              <div className="profile-infoItem">
                <span className="profile-infoLabel">誕生日</span>
                <span className="profile-infoValue">
                  {profile.birthdayVisibility === "非公開"
                    ? "非公開"
                    : profile.birthday}
                </span>
              </div>

              <div className="profile-infoItem">
                <span className="profile-infoLabel">ROAD3開始日</span>
                <span className="profile-infoValue">
                  {formatJoinedDate(profile.joinedAt)}
                </span>
              </div>
            </div>

            {profile.links.length > 0 && (
              <div className="profile-links">
                <div className="profile-sectionTitle">リンク</div>
                <div className="profile-linkList">
                  {profile.links.map((link, index) => (
                    <a
                      key={`${link}-${index}`}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="profile-linkItem"
                    >
                      🔗 {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {profile.showFollowCounts && (
              <div className="profile-followInfo">
                <button
                  type="button"
                  className="profile-followBtn"
                  onClick={() => navigate("/profile/follow?tab=followers")}
                >
                  フォロワー {followerCount}
                </button>

                <button
                  type="button"
                  className="profile-followBtn"
                  onClick={() => navigate("/profile/follow?tab=following")}
                >
                  フォロー中 {followingCount}
                </button>
              </div>
            )}

            {profile.favoriteTags.length > 0 && (
              <div className="profile-tags">
                <div className="profile-sectionTitle">よく使うタグ</div>
                <div className="profile-tagList">
                  {profile.favoriteTags.map((tag, index) => (
                    <button
                      type="button"
                      key={`${tag}-${index}`}
                      className="profile-tag"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {pinnedPost && (
              <div className="profile-pinned">
                <div className="profile-sectionTitle">📌 固定シグナル</div>
                <button
                  type="button"
                  className="profile-postCard"
                  onClick={() => navigate(`/posts/${pinnedPost.id}`)}
                >
                  <div className="profile-postCardHead">
                    <strong>{pinnedPost.author || "名前未設定"}</strong>
                    <span>{new Date(pinnedPost.timestamp).toLocaleString()}</span>
                  </div>
                  <p>{pinnedPost.text || "本文なし"}</p>
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="profile-tabsSection">
          <div className="profile-tabs">
            <button
              type="button"
              className={`profile-tab ${
                activeTab === "signals" ? "active" : ""
              }`}
              onClick={() => setActiveTab("signals")}
            >
              シグナル {myPosts.length}
            </button>

            <button
              type="button"
              className={`profile-tab ${
                activeTab === "replies" ? "active" : ""
              }`}
              onClick={() => setActiveTab("replies")}
            >
              返信 {replyPosts.length}
            </button>

            <button
              type="button"
              className={`profile-tab ${activeTab === "media" ? "active" : ""}`}
              onClick={() => setActiveTab("media")}
            >
              メディア {mediaPosts.length}
            </button>

            <button
              type="button"
              className={`profile-tab ${
                activeTab === "videos" ? "active" : ""
              }`}
              onClick={() => setActiveTab("videos")}
            >
              動画 {videoPosts.length}
            </button>

            <button
              type="button"
              className={`profile-tab ${activeTab === "likes" ? "active" : ""}`}
              onClick={() => setActiveTab("likes")}
            >
              いいね {likedPosts.length}
            </button>

            <button
              type="button"
              className={`profile-tab ${activeTab === "saved" ? "active" : ""}`}
              onClick={() => setActiveTab("saved")}
            >
              保存 {savedPosts.length}
            </button>
          </div>

          <div className="profile-tabContent">
            {currentTabItems.length === 0 ? (
              <div className="profile-emptyCard">
                {tabLabelMap[activeTab]}はまだありません。
              </div>
            ) : (
              currentTabItems.map((post) => (
                <button
                  type="button"
                  key={post.id}
                  className="profile-postCard"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  <div className="profile-postCardHead">
                    <strong>{post.author || "名前未設定"}</strong>
                    <span>{new Date(post.timestamp).toLocaleString()}</span>
                  </div>
                  <p>{post.text || "本文なし"}</p>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      {isSettingsOpen && (
        <div
          className="profile-overlay"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h3>個人設定</h3>

            <label className="profile-settingRow">
              <span>アカウントの状態</span>
              <strong>{profile.isPrivate ? "非公開" : "公開"}</strong>
            </label>

            <label className="profile-settingRow">
              <span>フォロー数表示</span>
              <div className="profile-followSettingCounts">
                <strong>{followingCount}</strong> フォロー /{" "}
                <strong>{followerCount}</strong> フォロワー
              </div>
              <strong>{profile.showFollowCounts ? "表示" : "非表示"}</strong>
            </label>

            <button
              type="button"
              className="profile-modalBtn"
              onClick={() => {
                setIsSettingsOpen(false);
                navigate("/profile/edit");
              }}
            >
              設定を編集する
            </button>

            <button
              type="button"
              className="profile-modalBtn secondary"
              onClick={() => setIsSettingsOpen(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}