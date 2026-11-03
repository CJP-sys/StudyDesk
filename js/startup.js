/* Page drawing and application start-up */
function render() {
  const app = $("#app");
  if (!U) {
    window.location.replace("login.html");
    return;
  }
  app.innerHTML = `<div class="app-shell"><header class="app-toolbar"><button class="app-brand ${view == "dashboard" ? "on" : ""}" data-a="nav" data-v="dashboard" aria-label="StudyDesk overview"><span class="app-brand-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 8.5a2 2 0 0 1 2-2h8l3 3h9a2 2 0 0 1 2 2v14H4z"/><path d="M10 16h12"/></svg></span><span>StudyDesk</span></button><nav class="app-nav" aria-label="Study features">${NAV.map((n) => `<button class="app-nav-item ${view == n[0] ? "on" : ""}" data-a="nav" data-v="${n[0]}">${n[1]}</button>`).join("")}</nav><div class="app-account"><span class="app-avatar">${esc(U.name.slice(0, 1).toUpperCase())}</span><span class="app-account-name">${esc(U.name)}</span><button class="app-logout" data-a="logout">Log out</button></div></header><main class="app-main">${V[view]()}</main></div>`;
}
(async function () {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (!user || error) {
    window.location.replace("login.html");
    return;
  }
  U = { id: user.id, name: user.user_metadata?.name || user.email?.split("@")[0] || "Student", email: user.email };
  try { D = await apiRequest("/data"); }
  catch (error) {
    console.error("Could not load study data:", error);
    toast(`Could not load your study data: ${error.message}`);
    load();
  }
  const h = location.hash.slice(1);
  if (NAV.some((n) => n[0] == h)) view = h;
  render();
})();
