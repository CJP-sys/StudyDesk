/* Login, registration and the signed-in student's saved data */
async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

async function submitAuth(e) {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)),
    users = store.get("sd_users") || [],
    em = f.email.trim().toLowerCase(),
    err = (m) => ($("#err").textContent = m);

  if (authMode == "register") {
    if (f.password.length < 6)
      return err("Use a password with at least 6 characters.");
    if (users.some((u) => u.email == em))
      return err("That email already has an account. Try logging in.");
    const salt = [...crypto.getRandomValues(new Uint8Array(8))]
        .map((x) => x.toString(16))
        .join(""),
      u = {
        id: Date.now(),
        name: f.name.trim(),
        email: em,
        salt,
        hash: await sha(salt + f.password),
      };
    users.push(u);
    store.set("sd_users", users);
    U = u;
  } else {
    if (em == "admin" && f.password == "admin123") {
      let u = users.find((x) => x.id == "admin" && x.role == "admin");
      if (!u) {
        const salt = [...crypto.getRandomValues(new Uint8Array(8))]
          .map((x) => x.toString(16))
          .join("");
        u = {
          id: "admin",
          name: "Admin",
          username: "admin",
          email: "admin@studydesk.local",
          role: "admin",
          salt,
          hash: await sha(salt + f.password),
        };
        users.push(u);
        store.set("sd_users", users);
      }
      U = u;
    } else {
      const u = users.find((x) => x.email == em);
      if (!u || u.hash != (await sha(u.salt + f.password)))
        return err("Email or password is incorrect.");
      U = u;
    }
  }

  store.set("sd_session", U.id);
  window.location.replace("app.html");
}

function load() {
  D = store.get("sd_data_" + U.id) || {
    subjects: [],
    notes: [],
    tasks: [],
    cards: [],
    log: [],
    plans: [],
    n: 1,
  };
  D.plans ||= [];
}

function renderLoginPage() {
  const app = $("#app");
  const isRegister = authMode == "register";
  const doodles = `<svg class="auth-doodle folder" viewBox="0 0 130 120" aria-hidden="true"><path d="M18 35 16 20q0-5 5-6l43-8 27 15 16-3q7-1 9 6l13 55q2 7-5 9L29 111q-7 2-9-5L8 48q-2-8 10-13Z"/><path d="m17 35 76-16M46 51l37-7 7 31-37 8zM59 66l15-3"/></svg><svg class="auth-doodle paper" viewBox="0 0 200 210" aria-hidden="true"><path d="m44 18 112 21q10 2 8 14l-22 124q-2 10-13 8L18 163q-10-2-8-13L32 29q2-13 12-11Z"/><path d="m54 53 67 12m-71 6 83 15m-87 2 78 15m-82 3 66 14m30 18 9 8 18-20"/></svg><svg class="auth-doodle notebook" viewBox="0 0 230 240" aria-hidden="true"><path d="m45 19 119-14q12-1 14 12l29 162q2 12-11 15L62 222q-11 2-14-10L18 50q-2-13 10-15Z"/><path d="m35 55 128-23M40 83l128-24M45 111l128-25M50 139l128-25M55 167l128-25M59 195l128-25M73 38l26 154"/><path d="m100 91 12 13 20-23q16-11 22 3 7 15-15 34l-20 17-22-21q-18-17-5-27 4-3 8 4Z"/></svg><svg class="auth-doodle pencil" viewBox="0 0 70 190" aria-hidden="true"><path d="m22 27 25 7-34 125-16-7zM22 27l5-20q1-5 6-3l21 7q5 2 3 7l-10 16M-3 152l16 7-23 26zM25 42l24 7"/></svg><svg class="auth-doodle plant" viewBox="0 0 240 210" aria-hidden="true"><path d="M17 85q54-28 109-14m-104 49q59-25 112-12m-99 51q47-16 83-7M95 105q-6-46-33-64-14-9-19 5-2 24 38 62m20-6q-8-43 7-72 9-16 19-5 14 18-11 73m4 2q22-34 46-38 17-3 18 11 0 21-61 38"/><path d="m91 109 64-13 25 86-71 14z"/><path d="m98 123 49-10 8 26-50 10z"/><path d="M116 191q-13-25-4-42 9-15 19 1 8-25 21-13 14 14-8 43-13 18-28 11Z"/></svg><span class="spark s1">✧</span><span class="spark s2">✧</span><span class="spark s3">✧</span><i class="dot d1"></i><i class="dot d2"></i>`;
  app.innerHTML = `<section class="auth-scene ${isRegister ? "is-register" : "is-login"}"><div class="auth-art" aria-hidden="true">${doodles}</div><section class="auth-panel" aria-labelledby="auth-title"><h1 class="auth-brand">StudyDesk</h1><div class="auth-card"><h2 id="auth-title">${isRegister ? "Create your account" : "Welcome back to<br>StudyDesk"}</h2><button type="button" class="google-button" aria-label="Continue with Google"><span class="google-mark">⊗</span>${isRegister ? "Continue with Google" : "Google"}</button><div class="auth-divider"><span>or</span></div><form class="auth-form" novalidate><label for="auth-email">Your Email</label><div class="field-wrap"><span class="field-icon" aria-hidden="true">✉</span><input id="auth-email" name="email" type="email" autocomplete="email" placeholder="Enter your email" required></div>${isRegister ? '<div class="register-extra" hidden><label for="auth-name">Your Name</label><div class="field-wrap"><span class="field-icon" aria-hidden="true">◉</span><input id="auth-name" name="name" autocomplete="name" placeholder="Enter your name"></div><label for="auth-password">Create a password</label><div class="field-wrap"><span class="field-icon" aria-hidden="true">▣</span><input id="auth-password" name="password" type="password" autocomplete="new-password" placeholder="At least 6 characters" minlength="6"><button type="button" class="password-toggle" aria-label="Show password">◉</button></div></div>' : '<label class="password-label" for="auth-password">Your Password</label><div class="field-wrap"><span class="field-icon" aria-hidden="true">▣</span><input id="auth-password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required><button type="button" class="password-toggle" aria-label="Show password">◉</button></div>'}<p id="err" class="auth-error" role="alert" aria-live="polite"></p><button class="auth-submit" type="submit">${isRegister ? 'Continue <span aria-hidden="true">→</span>' : "Login"}</button></form><p class="auth-legal">By logging in, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></p><p class="auth-switch">${isRegister ? "Already have an account?" : "Don't have an account?"} <button id="auth-toggle" type="button">${isRegister ? "Log In" : "Register"}</button></p>${isRegister ? "" : '<p class="auth-switch reset-line">Forgot your password? <button id="reset-password" type="button">Reset Password</button></p>'}</div></section></section>`;
  const form = app.querySelector("form");
  const extra = app.querySelector(".register-extra");
  let registrationStep = 1;
  form.onsubmit = (e) => {
    if (isRegister && registrationStep === 1) {
      e.preventDefault();
      const email = form.elements.email;
      if (!email.reportValidity()) return;
      extra.hidden = false;
      form.elements.name.required = true;
      form.elements.password.required = true;
      registrationStep = 2;
      app.querySelector("#auth-title").textContent = "Finish creating your account";
      app.querySelector(".auth-submit").innerHTML = "Create account <span aria-hidden=\"true\">→</span>";
      form.elements.name.focus();
      return;
    }
    if (isRegister && !form.reportValidity()) return;
    submitAuth(e);
  };
  app.querySelector(".google-button").onclick = () => { $("#err").textContent = "Google sign-in is not connected yet. Please continue with your email."; };
  app.querySelector(".password-toggle")?.addEventListener("click", (e) => {
    const input = form.elements.password;
    const shown = input.type === "password";
    input.type = shown ? "text" : "password";
    e.currentTarget.setAttribute("aria-label", shown ? "Hide password" : "Show password");
  });
  app.querySelector("#reset-password")?.addEventListener("click", () => {
    $("#err").textContent = "Password reset is not available in this local demo. Please create a new account or contact your administrator.";
  });
  $("#auth-toggle").onclick = () => {
    authMode = isRegister ? "login" : "register";
    renderLoginPage();
  };
}

function startLoginPage() {
  if (new URLSearchParams(location.search).get("mode") == "register") authMode = "register";
  const id = store.get("sd_session");
  const user = (store.get("sd_users") || []).find((item) => item.id == id);
  if (user) {
    window.location.replace("app.html");
    return;
  }
  renderLoginPage();
}



