import "./SignalThread.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import PostCard from "../components/PostCard";

function SignalThread() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [replyText, setReplyText] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);

  const baseParentPost = location.state?.post || {
    id: Number(id),
    name: "ユーザー名",
    userId: "@sample_user",
    time: "2時間前",
    content: `シグナルID ${id} の投稿です。`,
    comments: 0,
    resignals: 0,
    likes: 0,
    level: 0,
    isMine: false,
    image: null,
    tags: [],
  };

  const storageKey = `signalReplies-${id}`;

  const [replies, setReplies] = useState(() => {
    const savedReplies = localStorage.getItem(storageKey);
    return savedReplies ? JSON.parse(savedReplies) : [];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(replies));
  }, [replies, storageKey]);

  const parentPost = {
    ...baseParentPost,
    comments: replies.length,
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;

    const newReply = {
      id: Date.now(),
      name: "自分",
      userId: "@my_account",
      time: "今",
      content: replyText,
      comments: 0,
      resignals: 0,
      likes: 0,
      level: replyTarget ? replyTarget.level + 1 : 0,
      isMine: true,
      parentId: replyTarget ? replyTarget.id : Number(id),
      replyToName: replyTarget ? replyTarget.name : parentPost.name,
      replyToUserId: replyTarget ? replyTarget.userId : parentPost.userId,
    };

    setReplies((prev) => [...prev, newReply]);
    setReplyText("");
    setReplyTarget(null);
  };

  const handleDeleteReply = (replyId) => {
    const confirmed = window.confirm("この返信を削除しますか？");
    if (!confirmed) return;

    setReplies((prev) => prev.filter((reply) => reply.id !== replyId));

    if (replyTarget && replyTarget.id === replyId) {
      setReplyTarget(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendReply();
    }
  };

  const handleReplyClick = (targetReply) => {
    setReplyTarget(targetReply);
  };

  return (
    <div className="thread-page">
      <div className="thread-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h2>シグナル</h2>
      </div>

      <div className="thread-parent">
        <div className="thread-parent-card">
          <PostCard post={parentPost} clickable={false} />

          {parentPost.image && (
            <div className="thread-parent-imageWrap">
              <img
                src={parentPost.image}
                alt="投稿画像"
                className="thread-parent-image"
                onClick={() => setExpandedImage(parentPost.image)}
              />
            </div>
          )}

          {parentPost.tags && parentPost.tags.length > 0 && (
            <div className="thread-parent-tags">
              {parentPost.tags.map((tag) => (
                <span key={tag} className="thread-parent-tag">
                  #{String(tag).replace(/^#/, "")}
                </span>
              ))}
            </div>
          )}

          <div className="thread-card-actions">
            <button
              className="thread-reply-button"
              onClick={() => setReplyTarget(parentPost)}
            >
              このシグナルに返信
            </button>
          </div>
        </div>
      </div>

      <div className="thread-replies">
        {replies.length === 0 ? (
          <p className="thread-empty-text">まだ返信はありません</p>
        ) : (
          replies.map((reply) => (
            <div
              key={reply.id}
              className={`thread-reply thread-level-${reply.level}`}
            >
              <div
                className="thread-reply-inner"
                style={{ marginLeft: `${reply.level * 28}px` }}
              >
                <div className="thread-reply-card-wrap">
                  <PostCard post={reply} clickable={false} />

                  <div className="thread-card-actions">
                    <button
                      className="thread-reply-button"
                      onClick={() => handleReplyClick(reply)}
                    >
                      返信する
                    </button>

                    {reply.isMine && (
                      <button
                        className="reply-delete-button"
                        onClick={() => handleDeleteReply(reply.id)}
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="thread-input-wrap">
        {replyTarget && (
          <div className="reply-target-bar">
            <span>{replyTarget.name} に返信中</span>
            <button onClick={() => setReplyTarget(null)}>×</button>
          </div>
        )}

        <div className="thread-input">
          <input
            type="text"
            placeholder="返信を書く..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSendReply} disabled={!replyText.trim()}>
            送信
          </button>
        </div>
      </div>

      {expandedImage && (
        <div
          className="thread-image-modal"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="拡大画像"
            className="thread-image-modal-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="thread-image-close"
            onClick={() => setExpandedImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default SignalThread;