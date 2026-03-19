import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileEdit.css";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeTag(tag) {
  return String(tag || "")
    .replace(/^#/, "")
    .trim();
}

export default function ProfileEdit() {
  const navigate = useNavigate();

  const currentAccount = useMemo(
    () => safeParse(localStorage.getItem("currentAccount"), null),
    []
  );

  const allProfileSettings = useMemo(
    () => safeParse(localStorage.getItem("profileSettings"), {}),
    []
  );

  const accountSettings = useMemo(() => {
    if (!currentAccount?.id) return {};
    return allProfileSettings[currentAccount.id] || {};
  }, [allProfileSettings, currentAccount]);

  const [name, setName] = useState(currentAccount?.name || "");
  const [bio, setBio] = useState(accountSettings.bio || "");
  const [place, setPlace] = useState(accountSettings.place || "");
  const [link1, setLink1] = useState(accountSettings.links?.[0] || "");
  const [link2, setLink2] = useState(accountSettings.links?.[1] || "");
  const [link3, setLink3] = useState(accountSettings.links?.[2] || "");
  const [birthday, setBirthday] = useState(accountSettings.birthday || "");
  const [birthdayVisibility, setBirthdayVisibility] = useState(
    accountSettings.birthdayVisibility || "非公開"
  );
  const [showFollowCounts, setShowFollowCounts] = useState(
    typeof accountSettings.showFollowCounts === "boolean"
      ? accountSettings.showFollowCounts
      : true
  );
  const [favoriteTagsText, setFavoriteTagsText] = useState(
    Array.isArray(accountSettings.favoriteTags)
      ? accountSettings.favoriteTags.join(", ")
      : ""
  );
  const [headerImage, setHeaderImage] = useState(accountSettings.headerImage || "");
  const [avatarImage, setAvatarImage] = useState(accountSettings.avatarImage || "");
  const [isPrivate, setIsPrivate] = useState(!!accountSettings.isPrivate);

  useEffect(() => {
    if (!currentAccount) {
      navigate("/login");
    }
  }, [currentAccount, navigate]);

  const bioCount = bio.length;

  const handleFileToBase64 = (file, setter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setter(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!currentAccount?.id) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("名前を入力してね。");
      return;
    }

    if (bio.length > 200) {
      alert("自己紹介は200文字以内で入力してね。");
      return;
    }

    const tags = favoriteTagsText
      .split(",")
      .map(normalizeTag)
      .filter(Boolean)
      .slice(0, 5);

    const links = [link1.trim(), link2.trim(), link3.trim()].filter(Boolean);

    const nextProfileSettings = {
      ...allProfileSettings,
      [currentAccount.id]: {
        ...accountSettings,
        bio: bio.trim(),
        place: place.trim(),
        links,
        birthday: birthday.trim(),
        birthdayVisibility,
        showFollowCounts,
        favoriteTags: tags,
        headerImage,
        avatarImage,
        isPrivate,
        joinedAt: accountSettings.joinedAt || currentAccount.createdAt || Date.now(),
      },
    };

    localStorage.setItem("profileSettings", JSON.stringify(nextProfileSettings));

    const allAccounts = safeParse(localStorage.getItem("accounts"), []);
    const nextAccounts = allAccounts.map((acc) =>
      String(acc.id) === String(currentAccount.id)
        ? { ...acc, name: trimmedName }
        : acc
    );

    const nextCurrentAccount = {
      ...currentAccount,
      name: trimmedName,
    };

    localStorage.setItem("accounts", JSON.stringify(nextAccounts));
    localStorage.setItem("currentAccount", JSON.stringify(nextCurrentAccount));

    alert("プロフィールを保存したよ。");
    navigate("/profile");
  };

  return (
    <div className="profileEdit-page">
      <div className="profileEdit-topbar">
        <button
          type="button"
          className="profileEdit-back"
          onClick={() => navigate(-1)}
        >
          ← 戻る
        </button>

        <h2 className="profileEdit-title">プロフィール編集</h2>

        <button
          type="button"
          className="profileEdit-save"
          onClick={handleSave}
        >
          保存
        </button>
      </div>

      <div className="profileEdit-content">
        <section className="profileEdit-card">
          <div className="profileEdit-headerArea">
            <div className="profileEdit-headerPreview">
              {headerImage ? (
                <img
                  src={headerImage}
                  alt="ヘッダー"
                  className="profileEdit-headerImage"
                />
              ) : (
                <div className="profileEdit-headerPlaceholder" />
              )}
            </div>

            <label className="profileEdit-uploadBtn">
              ヘッダー変更
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  handleFileToBase64(e.target.files?.[0], setHeaderImage)
                }
              />
            </label>
          </div>

          <div className="profileEdit-avatarRow">
            <div className="profileEdit-avatarWrap">
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt="アイコン"
                  className="profileEdit-avatarImage"
                />
              ) : (
                <div className="profileEdit-avatar">
                  {(name || currentAccount?.name || "?").charAt(0)}
                </div>
              )}
            </div>

            <label className="profileEdit-uploadBtn">
              アイコン変更
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  handleFileToBase64(e.target.files?.[0], setAvatarImage)
                }
              />
            </label>
          </div>

          <div className="profileEdit-form">
            <label className="profileEdit-field">
              <span className="profileEdit-label">名前</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="名前"
                className="profileEdit-input"
              />
            </label>

            <label className="profileEdit-field">
              <span className="profileEdit-label">自己紹介</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="自己紹介"
                className="profileEdit-textarea"
                maxLength={200}
              />
              <div className="profileEdit-count">{bioCount}/200</div>
            </label>

            <label className="profileEdit-field">
              <span className="profileEdit-label">居場所</span>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="居場所"
                className="profileEdit-input"
              />
            </label>

            <div className="profileEdit-field">
              <span className="profileEdit-label">リンク（最大3つ）</span>

              <input
                type="text"
                value={link1}
                onChange={(e) => setLink1(e.target.value)}
                placeholder="リンク1"
                className="profileEdit-input"
              />
              <input
                type="text"
                value={link2}
                onChange={(e) => setLink2(e.target.value)}
                placeholder="リンク2"
                className="profileEdit-input"
              />
              <input
                type="text"
                value={link3}
                onChange={(e) => setLink3(e.target.value)}
                placeholder="リンク3"
                className="profileEdit-input"
              />
            </div>

            <label className="profileEdit-field">
              <span className="profileEdit-label">誕生日</span>
              <input
                type="text"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                placeholder="例：3月10日"
                className="profileEdit-input"
              />
            </label>

            <div className="profileEdit-field">
              <span className="profileEdit-label">誕生日公開設定</span>
              <div className="profileEdit-options">
                {["非公開", "年非公開", "全公開"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`profileEdit-option ${
                      birthdayVisibility === option ? "active" : ""
                    }`}
                    onClick={() => setBirthdayVisibility(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="profileEdit-field">
              <span className="profileEdit-label">フォロー / フォロワー数表示</span>
              <div className="profileEdit-options">
                <button
                  type="button"
                  className={`profileEdit-option ${showFollowCounts ? "active" : ""}`}
                  onClick={() => setShowFollowCounts(true)}
                >
                  表示
                </button>
                <button
                  type="button"
                  className={`profileEdit-option ${!showFollowCounts ? "active" : ""}`}
                  onClick={() => setShowFollowCounts(false)}
                >
                  非表示
                </button>
              </div>
            </div>

            <label className="profileEdit-field">
              <span className="profileEdit-label">よく使うタグ（最大5つ）</span>
              <input
                type="text"
                value={favoriteTagsText}
                onChange={(e) => setFavoriteTagsText(e.target.value)}
                placeholder="例：音楽, 散歩, 読書"
                className="profileEdit-input"
              />
              <small className="profileEdit-help">
                カンマ区切りで入力してね
              </small>
            </label>

            <div className="profileEdit-field">
              <span className="profileEdit-label">アカウント公開設定</span>
              <div className="profileEdit-options">
                <button
                  type="button"
                  className={`profileEdit-option ${!isPrivate ? "active" : ""}`}
                  onClick={() => setIsPrivate(false)}
                >
                  公開
                </button>
                <button
                  type="button"
                  className={`profileEdit-option ${isPrivate ? "active" : ""}`}
                  onClick={() => setIsPrivate(true)}
                >
                  非公開
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}