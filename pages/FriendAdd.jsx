import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FriendAdd.css";

function FriendAdd() {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualAvatarImage, setManualAvatarImage] = useState(null);

  // 仮の候補一覧
  const candidateFriends = [
    { id: "4", name: "みき", avatar: "み", avatarImage: null },
    { id: "5", name: "ゆう", avatar: "ゆ", avatarImage: null },
    { id: "6", name: "さな", avatar: "さ", avatarImage: null },
  ];

  const closedFriends = useMemo(() => {
    return JSON.parse(localStorage.getItem("closedFriends") || "[]");
  }, []);

  const filteredCandidates = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return candidateFriends.filter((friend) => {
      const alreadyAdded = closedFriends.some(
        (item) => String(item.id) === String(friend.id)
      );
      if (alreadyAdded) return false;

      if (!keyword) return true;

      return (
        friend.name.toLowerCase().includes(keyword) ||
        String(friend.id).includes(keyword)
      );
    });
  }, [searchText, closedFriends]);

  const saveFriends = (updatedFriends) => {
    localStorage.setItem("closedFriends", JSON.stringify(updatedFriends));
  };

  const handleAddCandidate = (friend) => {
    const current = JSON.parse(localStorage.getItem("closedFriends") || "[]");
    const exists = current.some(
      (item) => String(item.id) === String(friend.id)
    );
    if (exists) return;

    const updated = [...current, friend];
    saveFriends(updated);
    navigate("/closed");
  };

  const handleManualImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setManualAvatarImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleManualAdd = () => {
    const trimmed = manualName.trim();
    if (!trimmed) {
      alert("名前を入力してください");
      return;
    }

    const current = JSON.parse(localStorage.getItem("closedFriends") || "[]");

    const newFriend = {
      id: Date.now().toString(),
      name: trimmed,
      avatar: trimmed.charAt(0),
      avatarImage: manualAvatarImage || null,
    };

    const updated = [...current, newFriend];
    saveFriends(updated);

    setManualName("");
    setManualAvatarImage(null);
    navigate("/closed");
  };

  return (
    <div className="friend-add-page">
      <div className="friend-add-topbar">
        <button
          type="button"
          className="friend-add-back"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <h2 className="friend-add-title">友だち追加</h2>
      </div>

      <section className="friend-add-section">
        <div className="friend-add-section-head">
          <h3>検索して追加</h3>
          <span>名前 / IDで検索</span>
        </div>

        <input
          type="text"
          className="friend-add-search"
          placeholder="名前またはIDを入力"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <div className="friend-add-list">
          {filteredCandidates.length === 0 ? (
            <p className="friend-add-empty">追加できる候補がありません</p>
          ) : (
            filteredCandidates.map((friend) => (
              <div key={friend.id} className="friend-add-item">
                <div className="friend-add-item-left">
                  <div className="friend-add-avatar">
                    {friend.avatarImage ? (
                      <img
                        src={friend.avatarImage}
                        alt={friend.name}
                        className="friend-add-avatar-image"
                      />
                    ) : (
                      <span>{friend.avatar}</span>
                    )}
                  </div>

                  <div className="friend-add-meta">
                    <strong>{friend.name}</strong>
                    <span>ID: {friend.id}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="friend-add-action"
                  onClick={() => handleAddCandidate(friend)}
                >
                  追加
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="friend-add-section">
        <div className="friend-add-section-head center">
          <h3>追加方法</h3>
        </div>

        <button
          type="button"
          className="friend-add-method"
          onClick={() => alert("QRコード機能はこれから実装")}
        >
          QRコード
        </button>

        <button
          type="button"
          className="friend-add-method"
          onClick={() => alert("ID検索機能はこれから実装")}
        >
          ID
        </button>

        <button
          type="button"
          className="friend-add-method"
          onClick={() => alert("招待URL機能はこれから実装")}
        >
          招待URL
        </button>
      </section>

      <section className="friend-add-section">
        <div className="friend-add-section-head center">
          <h3>手動で追加</h3>
        </div>

        <input
          type="text"
          className="friend-add-search"
          placeholder="名前"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          className="friend-add-file"
          onChange={handleManualImageUpload}
        />

        {manualAvatarImage && (
          <div className="friend-add-preview">
            <img
              src={manualAvatarImage}
              alt="preview"
              className="friend-add-preview-image"
            />
          </div>
        )}

        <button
          type="button"
          className="friend-add-manual-button"
          onClick={handleManualAdd}
        >
          追加
        </button>
      </section>
    </div>
  );
}

export default FriendAdd;