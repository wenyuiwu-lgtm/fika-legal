// 網頁自助刪除帳號(2026/10/28,Google Play 要求有公開的刪除帳號網址;Apple 5.1.1(v))。
// 流程:用信箱+密碼登入(不保存登入狀態)→ 勾選確認 → 呼叫 Edge Function delete-account(與 App 內「刪除帳號」同一支)→ 登出。
// 這裡的網址與 anon key 本來就是公開值(App 內也有同一份),不是機密;真正的權限由登入 token 與 RLS / Edge Function 驗證把關。
(function () {
  var SUPABASE_URL = "https://dgeisvbkhnhfmadnfiqm.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZWlzdmJraG5oZm1hZG5maXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDc3ODcsImV4cCI6MjA5ODUyMzc4N30.k1ufhHnn28uLfR6gPXyjAcAoVjvz5NTO8O5L4YjBKiE";

  var T = {
    "zh-TW": {
      title: "網頁刪除帳號(需登入)",
      intro: "用註冊時的信箱與密碼登入,確認後會立即刪除帳號與所有資料。訪客帳號沒有信箱與密碼,請在 App 內「設定 → 刪除帳號」刪除。",
      email: "信箱", password: "密碼", signin: "登入",
      signedIn: "已登入:",
      ack: "我了解帳號與所有資料(包含 svenska-app 字典的同一個登入帳號)會立即永久刪除,無法復原。",
      delete: "永久刪除我的帳號", cancel: "取消並登出",
      loginFailed: "登入失敗,請確認信箱與密碼。", busy: "處理中…",
      done: "帳號與所有資料已刪除。", failed: "刪除失敗,請稍後再試,或改在 App 內「設定 → 刪除帳號」。",
      cancelled: "已登出,沒有刪除任何資料。"
    },
    "zh-CN": {
      title: "网页删除账号(需登录)",
      intro: "用注册时的邮箱与密码登录,确认后会立即删除账号与所有数据。访客账号没有邮箱与密码,请在 App 内“设置 → 删除账号”删除。",
      email: "邮箱", password: "密码", signin: "登录",
      signedIn: "已登录:",
      ack: "我了解账号与所有数据(包含 svenska-app 字典的同一个登录账号)会立即永久删除,无法恢复。",
      delete: "永久删除我的账号", cancel: "取消并退出登录",
      loginFailed: "登录失败,请确认邮箱与密码。", busy: "处理中…",
      done: "账号与所有数据已删除。", failed: "删除失败,请稍后再试,或改在 App 内“设置 → 删除账号”。",
      cancelled: "已退出登录,没有删除任何数据。"
    },
    "en": {
      title: "Delete account on the web (sign-in required)",
      intro: "Sign in with the email and password you registered with. After you confirm, your account and all data are deleted immediately. Guest accounts have no email or password; delete them in the App under “Settings → Delete Account”.",
      email: "Email", password: "Password", signin: "Sign in",
      signedIn: "Signed in as:",
      ack: "I understand my account and all data (including the same login used for the svenska-app dictionary) will be permanently deleted and cannot be recovered.",
      delete: "Permanently delete my account", cancel: "Cancel and sign out",
      loginFailed: "Sign-in failed. Please check your email and password.", busy: "Working…",
      done: "Your account and all data have been deleted.", failed: "Deletion failed. Please try again later, or delete it in the App under “Settings → Delete Account”.",
      cancelled: "Signed out. Nothing was deleted."
    }
  };

  var root = document.getElementById("web-delete");
  if (!root || !window.supabase) return;
  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  var els = {
    login: document.getElementById("del-login"),
    email: document.getElementById("del-email"),
    password: document.getElementById("del-password"),
    signin: document.getElementById("del-signin"),
    confirm: document.getElementById("del-confirm"),
    who: document.getElementById("del-who"),
    ack: document.getElementById("del-ack"),
    go: document.getElementById("del-go"),
    cancel: document.getElementById("del-cancel"),
    msg: document.getElementById("del-msg")
  };
  var session = null;
  var lastMsgKey = null;

  function lang() {
    var l = document.documentElement.lang;
    return T[l] ? l : "en";
  }
  function tr(key) { return T[lang()][key]; }
  function setMsg(key) { lastMsgKey = key; els.msg.textContent = key ? tr(key) : ""; }
  function applyText() {
    root.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = tr(el.getAttribute("data-i18n")); });
    if (lastMsgKey) els.msg.textContent = tr(lastMsgKey);
  }
  function setBusy(busy) {
    els.signin.disabled = busy;
    els.go.disabled = busy || !els.ack.checked;
    els.cancel.disabled = busy;
  }
  function showLogin() {
    session = null;
    els.confirm.hidden = true;
    els.login.hidden = false;
    els.password.value = "";
    els.ack.checked = false;
    els.go.disabled = true;
  }

  els.login.addEventListener("submit", function (e) {
    e.preventDefault();
    setBusy(true);
    setMsg("busy");
    client.auth.signInWithPassword({ email: els.email.value.trim(), password: els.password.value }).then(function (res) {
      setBusy(false);
      if (res.error || !res.data || !res.data.session) { setMsg("loginFailed"); return; }
      session = res.data.session;
      els.who.textContent = res.data.user && res.data.user.email ? res.data.user.email : els.email.value.trim();
      els.password.value = "";
      els.login.hidden = true;
      els.confirm.hidden = false;
      setMsg(null);
    }).catch(function () { setBusy(false); setMsg("loginFailed"); });
  });

  els.ack.addEventListener("change", function () { els.go.disabled = !els.ack.checked; });

  els.cancel.addEventListener("click", function () {
    client.auth.signOut().catch(function () {});
    showLogin();
    setMsg("cancelled");
  });

  els.go.addEventListener("click", function () {
    if (!session || !els.ack.checked) return;
    setBusy(true);
    setMsg("busy");
    fetch(SUPABASE_URL + "/functions/v1/delete-account", {
      method: "POST",
      headers: { Authorization: "Bearer " + session.access_token, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: "{}"
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) { return { ok: r.ok && body.ok, body: body }; });
    }).then(function (res) {
      if (res.ok) {
        client.auth.signOut().catch(function () {});
        els.email.value = "";
        showLogin();
        els.login.hidden = true;
        setBusy(false);
        els.signin.disabled = true;
        setMsg("done");
      } else {
        setBusy(false);
        setMsg("failed");
      }
    }).catch(function () { setBusy(false); setMsg("failed"); });
  });

  new MutationObserver(applyText).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  applyText();
  showLogin();
})();
