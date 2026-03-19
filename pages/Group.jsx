import { useState, useEffect, useRef } from "react";
import "./Group.css";

function Group({ currentAccount, setNotifications }) {
  const [input, setInput] = useState("");
  const [allPosts, setAllPosts] = useState({});
  const postsEndRef = useRef(null);

  // LocalStorageから既存投稿を取得
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("groupPosts") || "{}");
    setAllPosts(stored);
  }, []);

  // currentAccountに対応した投稿
  const posts = allPosts[currentAccount.id] || [];

  // 新しい投稿時に自動スクロール
  useEffect(() => {
    postsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts]);

 const handlePost = () => {
  if (!input.trim()) return;

  const newPost = {
    id: Date.now(),
    text: input,
    timestamp: Date.now(),
    author: currentAccount.name,
    space: "group",
    accountId: currentAccount.id,
  };

  // 🔔 通知
  setNotifications((prev) => [
    {
      id: Date.now(),
      type: "group",
      from: currentAccount.name,
      message: `${currentAccount.name}がGroupに投稿しました`,
      link: "/group",
      isRead: false,
      createdAt: Date.now(),
    },
    ...prev,
  ]);

  const updated = {
    ...allPosts,
    [currentAccount.id]: [...posts, newPost],
  };

  setAllPosts(updated);
  localStorage.setItem("groupPosts", JSON.stringify(updated));
  setInput("");
};

  return (
    <div className="group-page">
      <header className="group-header">
        <h2>グループスペース</h2>
      </header>

      <main className="group-posts">
        {[...posts]
  .sort((a, b) => b.timestamp - a.timestamp)
  .map((post) => (
          <div key={post.id} className="group-post">
            <p>
              <strong>{post.author}: </strong> {post.text}
            </p>
            <small>{new Date(post.timestamp).toLocaleString()}</small>
          </div>
        ))}
        <div ref={postsEndRef} />
      </main>

      <footer className="group-input">
        <input
          type="text"
          placeholder="投稿内容を入力"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePost()}
        />
        <button onClick={handlePost}>投稿</button>
      </footer>
    </div>
  );
}

export default Group;
