import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./FollowPage.css";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function getSearchTab(search) {
  const params = new URLSearchParams(search);
  const tab = params.get("tab");
  return tab === "followers" ? "followers" : "following";
}

export default function FollowPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(getSearchTab(location.search));
  const [keyword, setKeyword] = useState("");

  const currentAccount = useMemo(
    () => safeParse(localStorage.getItem("currentAccount"), null),
    []
  );

  const currentId = String(currentAccount?.id || "");

  const followingUsers = useMemo(() => {
    if (!currentId) return [];
    return safeParse(localStorage.getItem(`followingList-${currentId}`), []);
  }, [currentId]);

  const followerUsers = useMemo(() => {
    if (!currentId) return [];
    return safeParse(localStorage.getItem(`followersList-${currentId}`), []);
  }, [currentId]);

  const visibleUsers = useMemo(() => {
    const base = activeTab === "followers" ? followerUsers : followingUsers;
    const q = keyword.trim().toLowerCase();

    if (!q) return base;

    return base.filter((user) => {
      const name = String(user.name || "").toLowerCase();
      const handle = String(user.userId || user.handle || `@${user.id}`).toLowerCase();
      return name.includes(q) || handle.includes(q);
    });
  }, [activeTab, followerUsers, followingUsers, keyword]);

  const updateTab = (tab) => {
    setActiveTab(tab);
    navigate(`/profile/follow?tab=${tab}`);
  };

  const toggleFollow = (targetUser) => {
    if (!currentId) return;

    const targetId = String(targetUser.id);
    if (targetId === currentId) return;

    const myFollowingKey = `followingList-${currentId}`;
    const targetFollowersKey = `followersList-${targetId}`;
    const followKey = `follow-${currentId}-${targetId}`;
    const targetFollowerCountKey = `followers-count-${targetId}`;

    const currentFollowingList = safeParse(
      localStorage.getItem(myFollowingKey),
      []
    );
    const currentFollowersList = safeParse(
      localStorage.getItem(targetFollowersKey),
      []
    );

    const alreadyFollowing = currentFollowingList.some(
      (item) => String(item.id) === targetId
    );

    const meData = {
      id: currentAccount.id,
      name: currentAccount.name || "ユーザー",
      userId: currentAccount.handle || `@${currentAccount.id}`,
    };

    if (alreadyFollowing) {
      const nextFollowingList = currentFollowingList.filter(
        (item) => String(item.id) !== targetId
      );
      const nextFollowersList = currentFollowersList.filter(
        (item) => String(item.id) !== currentId
      );

      localStorage.setItem(myFollowingKey, JSON.stringify(nextFollowingList));
      localStorage.setItem(targetFollowersKey, JSON.stringify(nextFollowersList));
      localStorage.setItem(followKey, "false");

      const currentCount = Number(
        localStorage.getItem(targetFollowerCountKey) ?? targetUser.followers ?? 0
      );
      localStorage.setItem(
        targetFollowerCountKey,
        String(Math.max(0, currentCount - 1))
      );
    } else {
      const normalizedTargetUser = {
        id: targetUser.id,
        name: targetUser.name || "名前未設定",
        userId: targetUser.userId || targetUser.handle || `@${targetUser.id}`,
        bio: targetUser.bio || "自己紹介はまだありません。",
        following: targetUser.following ?? 0,
        followers: targetUser.followers ?? 0,
        place: targetUser.place || "未設定",
        links: targetUser.links || [],
        birthday: targetUser.birthday || "非公開",
        joined: targetUser.joined || "ROAD3利用開始日",
        tags: targetUser.tags || [],
      };

      const nextFollowingList = currentFollowingList.some(
        (item) => String(item.id) === targetId
      )
        ? currentFollowingList
        : [normalizedTargetUser, ...currentFollowingList];

      const nextFollowersList = currentFollowersList.some(
        (item) => String(item.id) === currentId
      )
        ? currentFollowersList
        : [meData, ...currentFollowersList];

      localStorage.setItem(myFollowingKey, JSON.stringify(nextFollowingList));
      localStorage.setItem(targetFollowersKey, JSON.stringify(nextFollowersList));
      localStorage.setItem(followKey, "true");

      const currentCount = Number(
        localStorage.getItem(targetFollowerCountKey) ?? targetUser.followers ?? 0
      );
      localStorage.setItem(targetFollowerCountKey, String(currentCount + 1));
    }

    window.location.reload();
  };

  const openProfile = (user) => {
    const targetId = String(user.id);

    if (targetId === currentId) {
      navigate("/profile");
      return;
    }

    navigate(`/profile/user/${targetId}`, {
      state: {
        user: {
          id: user.id,
          name: user.name || "名前未設定",
          userId: user.userId || user.handle || `@${user.id}`,
          bio: user.bio || "自己紹介はまだありません。",
          following: user.following ?? 0,
          followers:
            Number(localStorage.getItem(`followers-count-${user.id}`)) ||
            user.followers ||
            0,
          place: user.place || "未設定",
          links: user.links || [],
          birthday: user.birthday || "非公開",
          joined: user.joined || "ROAD3利用開始日",
          tags: user.tags || [],
        },
      },
    });
  };

  const getRelationshipText = (targetId) => {
    const target = String(targetId);
    const iFollow = followingUsers.some((user) => String(user.id) === target);
    const followsMe = followerUsers.some((user) => String(user.id) === target);

    if (iFollow && followsMe) return "相互";
    if (iFollow) return "フォロー中";
    if (followsMe) return "フォロワー";
    return "";
  };

  if (!currentAccount) {
    return (
      <div className="followPage-page">
        <div className="followPage-topbar">
          <button
            type="button"
            className="followPage-back"
            onClick={() => navigate(-1)}
          >
            ← 戻る
          </button>
          <h2 className="followPage-title">フォロー</h2>
          <div className="followPage-right" />
        </div>

        <div className="followPage-empty">アカウント情報が見つかりません。</div>
      </div>
    );
  }

  return (
    <div className="followPage-page">
      <div className="followPage-topbar">
        <button
          type="button"
          className="followPage-back"
          onClick={() => navigate(-1)}
        >
          ← 戻る
        </button>

        <h2 className="followPage-title">フォロー / フォロワー</h2>

        <div className="followPage-right" />
      </div>

      <div className="followPage-content">
        <div className="followPage-searchWrap">
          <input
            type="text"
            className="followPage-search"
            placeholder="@ID / ユーザー名で検索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="followPage-tabs">
          <button
            type="button"
            className={`followPage-tab ${
              activeTab === "followers" ? "active" : ""
            }`}
            onClick={() => updateTab("followers")}
          >
            フォロワー {followerUsers.length}
          </button>

          <button
            type="button"
            className={`followPage-tab ${
              activeTab === "following" ? "active" : ""
            }`}
            onClick={() => updateTab("following")}
          >
            フォロー中 {followingUsers.length}
          </button>
        </div>

        <div className="followPage-list">
          {visibleUsers.length === 0 ? (
            <div className="followPage-empty">
              {activeTab === "followers"
                ? "フォロワーはいません。"
                : "フォロー中のユーザーはいません。"}
            </div>
          ) : (
            visibleUsers.map((user) => {
              const userId = String(user.id);
              const isFollowing = followingUsers.some(
                (item) => String(item.id) === userId
              );

              return (
                <div key={user.id} className="followPage-item">
                  <button
                    type="button"
                    className="followPage-userArea"
                    onClick={() => openProfile(user)}
                  >
                    <div className="followPage-avatar">
                      {(user.name || "?").charAt(0)}
                    </div>

                    <div className="followPage-meta">
                      <div className="followPage-nameRow">
                        <strong>{user.name || "名前未設定"}</strong>
                      </div>
                      <span>{user.userId || user.handle || `@${user.id}`}</span>
                      {getRelationshipText(user.id) && (
                        <small>{getRelationshipText(user.id)}</small>
                      )}
                    </div>
                  </button>

                  {userId !== currentId && (
                    <button
                      type="button"
                      className={`followPage-followBtn ${
                        isFollowing ? "following" : ""
                      }`}
                      onClick={() => toggleFollow(user)}
                    >
                      {isFollowing ? "フォロー中" : "フォローする"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}