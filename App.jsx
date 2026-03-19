import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";

import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Personal from "./pages/Personal";
import Layers from "./pages/Layers";
import Open from "./pages/Open";
import Group from "./pages/Group";
import Closed from "./pages/Closed";
import Chat from "./pages/Chat";
import Posts from "./pages/Posts";
import PostDetail from "./pages/PostDetail";
import Notifications from "./pages/Notifications";

import Header from "./components/Header";
import BottomNav from "./components/BottomNav";

import "./App.css";

import Memo from "./pages/Memo";
import Calendar from "./pages/Calendar";
import Activity from "./pages/Activity";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import FollowPage from "./pages/FollowPage";
import OtherProfile from "./pages/OtherProfile";
import SignalThread from "./pages/SignalThread";
import OpenDM from "./pages/OpenDM";
import OpenDMChat from "./pages/OpenDMChat";
import OpenDMSettings from "./pages/OpenDMSettings";
import Search from "./pages/Search";
import SearchTag from "./pages/SearchTag";
import QuoteResignal from "./pages/QuoteResignal";

import FriendAdd from "./pages/FriendAdd";
import LinkList from "./pages/LinkList";
import MediaList from "./pages/MediaList";
import FileList from "./pages/FileList";

/* =========================
   ① Routerラッパー
========================= */
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

/* =========================
   ② 本体（Routerの内側）
========================= */
function AppContent() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const location = useLocation();
  const pathname = location.pathname;

  /* ---------- path flags ---------- */
  const isWelcomePage = pathname === "/";
  const isLoginPage = pathname.startsWith("/login");
  const isSignupPage = pathname.startsWith("/signup");
  const isAuthPage = isWelcomePage || isLoginPage || isSignupPage;

  const isPersonal = pathname.startsWith("/personal");
  const isActivity = pathname.startsWith("/activity");
  const isProfile = pathname.startsWith("/profile");

  const isPostsPage = pathname === "/posts";
  const isPostDetail = pathname.startsWith("/posts/");

  const isOpen = pathname.startsWith("/open");
  const isGroup = pathname.startsWith("/group");
  const isClosed = pathname.startsWith("/closed");
  const isChat = pathname.startsWith("/chat");
  const isNotificationsPage = pathname.startsWith("/notifications");
  const isLayersPage = pathname.startsWith("/layers");
  const isSignalThreadPage = pathname.startsWith("/signal/");
  const isOpenDMPage = pathname.startsWith("/dm");

  /* ---------- Header / BottomNav visibility ---------- */
  const hideHeader =
    isAuthPage ||
    isActivity ||
    isProfile ||
    isPostsPage ||
    isPostDetail ||
    isOpen ||
    isGroup ||
    isClosed ||
    isChat ||
    isNotificationsPage ||
    isLayersPage ||
    isSignalThreadPage ||
    isOpenDMPage;

const hideBottomNav =
  isAuthPage ||
  isPersonal ||
  isActivity ||
  isProfile ||
  isPostsPage ||
  isPostDetail ||
  isClosed ||
  isChat ||
  isNotificationsPage ||
  isLayersPage ||
  isSignalThreadPage ||
  isOpenDMPage;

  /* ---------- accounts ---------- */
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem("accounts");
    return saved
      ? JSON.parse(saved)
      : [{ id: 1, type: "personal", name: "パーソナル" }];
  });

  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }, [accounts]);

  /* ---------- currentAccount ---------- */
  const [currentAccount, setCurrentAccount] = useState(() => {
    const saved = localStorage.getItem("currentAccount");
    if (saved) return JSON.parse(saved);
    return accounts?.[0] ?? null;
  });

  useEffect(() => {
    if (currentAccount) {
      localStorage.setItem("currentAccount", JSON.stringify(currentAccount));
    }
  }, [currentAccount]);

  useEffect(() => {
    if (!currentAccount && accounts.length > 0) {
      setCurrentAccount(accounts[0]);
    }
  }, [accounts, currentAccount]);

  /* ---------- notifications ---------- */
  const [notifications, setNotifications] = useState(() => {
    return JSON.parse(localStorage.getItem("notifications")) || [];
  });

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  return (
    <>
      {!hideHeader && isLoggedIn && currentAccount && (
        <Header
          currentAccount={currentAccount}
          setCurrentAccount={setCurrentAccount}
          accounts={accounts}
          setAccounts={setAccounts}
          onCustomizeApps={() => {
            window.dispatchEvent(new CustomEvent("road3-open-customize"));
          }}
          onAddApp={() => {
            window.dispatchEvent(new CustomEvent("road3-open-add-app"));
          }}
          onResetApps={() => {
            window.dispatchEvent(new CustomEvent("road3-reset-apps"));
          }}
          onOpenContact={() => {
            window.dispatchEvent(new CustomEvent("road3-open-contact"));
          }}
          onOpenSettings={() => {
            window.dispatchEvent(new CustomEvent("road3-open-settings"));
          }}
          onLogout={() => {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("currentAccount");
            window.location.href = "/login";
          }}
        />
      )}

      <Routes>
        {/* ---- ログイン前 ---- */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ---- 共通 ---- */}
        <Route path="/posts" element={<Posts />} />
        <Route path="/posts/:postId" element={<PostDetail />} />
        <Route path="/layers" element={<Layers />} />

        {/* ---- プロフィール ---- */}
        <Route
          path="/profile"
          element={isLoggedIn ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile/edit"
          element={isLoggedIn ? <ProfileEdit /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile/follow"
          element={isLoggedIn ? <FollowPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile/user/:userId"
          element={isLoggedIn ? <OtherProfile /> : <Navigate to="/login" />}
        />

        {/* ---- Signal Thread ---- */}
        <Route
          path="/signal/:id"
          element={isLoggedIn ? <SignalThread /> : <Navigate to="/login" />}
        />

        {/* ---- 要ログイン ---- */}
        <Route
          path="/personal"
          element={
            isLoggedIn ? (
              <Personal
                accounts={accounts}
                setAccounts={setAccounts}
                currentAccount={currentAccount}
                setCurrentAccount={setCurrentAccount}
                notifications={notifications}
                setNotifications={setNotifications}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/personal/memo"
          element={
            isLoggedIn ? (
              <Memo currentAccount={currentAccount} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/personal/calendar"
          element={isLoggedIn ? <Calendar /> : <Navigate to="/login" />}
        />

        {/* ---- Activity ---- */}
        <Route
          path="/activity/signals"
          element={
            isLoggedIn ? (
              <Activity
                accounts={accounts}
                currentAccount={currentAccount}
                notifications={notifications}
                setNotifications={setNotifications}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/activity/saved"
          element={
            isLoggedIn ? (
              <Activity
                accounts={accounts}
                currentAccount={currentAccount}
                notifications={notifications}
                setNotifications={setNotifications}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/activity/notifications"
          element={
            isLoggedIn ? (
              <Activity
                accounts={accounts}
                currentAccount={currentAccount}
                notifications={notifications}
                setNotifications={setNotifications}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/activity"
          element={<Navigate to="/activity/notifications" />}
        />

        <Route
          path="/open"
          element={
            isLoggedIn ? (
              <Open
                currentAccount={currentAccount}
                setNotifications={setNotifications}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/group"
          element={
            isLoggedIn ? (
              <Group
                currentAccount={currentAccount}
                setNotifications={setNotifications}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/closed"
          element={
            isLoggedIn ? (
              <Closed
                 accounts={accounts}
                 setAccounts={setAccounts}
                 currentAccount={currentAccount}
                 setCurrentAccount={setCurrentAccount}
                notifications={notifications}
                 setNotifications={setNotifications}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/chat/:friendId"
          element={
            isLoggedIn ? (
              <Chat
                currentAccount={currentAccount}
                setNotifications={setNotifications}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/notifications"
          element={
            isLoggedIn ? (
              <Notifications
                notifications={notifications}
                setNotifications={setNotifications}
                currentAccount={currentAccount}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/dm" element={<OpenDM />} />

        <Route
  path="/dm/chat/:userId"
  element={isLoggedIn ? <OpenDMChat /> : <Navigate to="/login" />}
/>

<Route
  path="/dm/settings"
  element={isLoggedIn ? <OpenDMSettings /> : <Navigate to="/login" />}
/>

<Route
  path="/search"
  element={isLoggedIn ? <Search /> : <Navigate to="/login" />}
/>

<Route
  path="/search/tag/:tagName"
  element={isLoggedIn ? <SearchTag /> : <Navigate to="/login" />}
/>

<Route
  path="/quote-resignal"
  element={isLoggedIn ? <QuoteResignal /> : <Navigate to="/login" />}
/>

<Route
  path="/friend-add"
  element={isLoggedIn ? <FriendAdd /> : <Navigate to="/login" />}
/>

<Route
  path="/chat/:friendId/links"
  element={
    isLoggedIn ? (
      <LinkList />
    ) : (
      <Navigate to="/login" />
    )
  }
/>

<Route
  path="/chat/:friendId/media"
  element={isLoggedIn ? <MediaList /> : <Navigate to="/login" />}
/>

<Route
  path="/chat/:friendId/files"
  element={isLoggedIn ? <FileList /> : <Navigate to="/login" />}
/>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {!hideBottomNav && isLoggedIn && (
        <BottomNav
          notifications={notifications}
          currentAccount={currentAccount}
        />
      )}
    </>
  );
}

export default App;