const root = document.getElementById("dashboard-root");
const config = window.NYASA_SUPABASE || {};
const apiBase = config.url ? config.url.replace(/\/$/, "") : "";

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  });
  children.forEach((child) => node.append(child));
  return node;
}

function getHashToken() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("access_token");
  if (token) {
    localStorage.setItem("nyasa_admin_token", token);
    history.replaceState(null, "", window.location.pathname);
  }
  return token || localStorage.getItem("nyasa_admin_token");
}

async function requestLogin(email) {
  const response = await fetch(`${apiBase}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      create_user: false,
      redirect_to: `${window.location.origin}/dashboard-admin`,
      options: { redirectTo: `${window.location.origin}/dashboard-admin` },
    }),
  });
  if (!response.ok) throw new Error("Could not send magic link");
}

async function fetchInteractions(token) {
  const response = await fetch(`${apiBase}/rest/v1/interactions?select=*&order=created_at.desc&limit=250`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Dashboard access denied or Supabase is not configured");
  return response.json();
}

function timeLabel(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderAuth(message = "") {
  root.innerHTML = "";
  const box = el("section", { className: "auth-box dash-panel" });
  box.append(
    el("p", { className: "eyebrow", text: "Private view" }),
    el("h1", { className: "dash-title", text: "Interaction dashboard" }),
    el("p", { className: "muted", text: "Enter the admin email configured in Supabase. A magic link will unlock this page." }),
  );
  const input = el("input", { type: "email", placeholder: config.adminEmail || "your@email.com", value: config.adminEmail || "" });
  const button = el("button", { className: "btn primary", text: "Send magic link" });
  const note = el("p", { className: "muted", text: message });
  button.addEventListener("click", async () => {
    button.textContent = "Sending...";
    try {
      await requestLogin(input.value.trim());
      note.textContent = "Magic link sent. Open it from your email on this browser.";
    } catch (error) {
      note.textContent = error.message;
    } finally {
      button.textContent = "Send magic link";
    }
  });
  box.append(input, button, note);
  root.append(box);
}

function renderDashboard(rows) {
  const answers = rows.filter((row) => row.event_type === "answer_click");
  const sessions = new Set(rows.map((row) => row.session_id).filter(Boolean));
  const mostRecent = rows[0]?.created_at;
  const answerCounts = answers.reduce((acc, row) => {
    const key = row.selected_answer || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const maxAnswer = Math.max(1, ...Object.values(answerCounts));

  root.innerHTML = "";
  const shell = el("div", { className: "dash-shell" });
  shell.append(
    el("div", { className: "dash-top" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Private analytics" }),
        el("h1", { className: "dash-title", text: "Interaction timeline" }),
      ]),
      el("button", { className: "btn", text: "Refresh" }),
    ]),
  );
  shell.querySelector("button").addEventListener("click", () => init(true));

  shell.append(el("section", { className: "dash-grid" }, [
    el("article", { className: "dash-card" }, [el("span", { text: "Total interactions" }), el("strong", { text: String(answers.length) })]),
    el("article", { className: "dash-card" }, [el("span", { text: "Sessions" }), el("strong", { text: String(sessions.size) })]),
    el("article", { className: "dash-card" }, [el("span", { text: "Latest click" }), el("strong", { text: mostRecent ? timeLabel(mostRecent) : "None" })]),
    el("article", { className: "dash-card" }, [el("span", { text: "Stored events" }), el("strong", { text: String(rows.length) })]),
  ]));

  const table = el("table", { className: "dash-table" });
  table.append(el("thead", {}, [el("tr", {}, [
    el("th", { text: "Question" }),
    el("th", { text: "Response" }),
    el("th", { text: "Time" }),
  ])]));
  const tbody = el("tbody");
  answers.forEach((row) => {
    tbody.append(el("tr", {}, [
      el("td", { text: row.question_text || "Unknown question" }),
      el("td", {}, [el("span", { className: "answer-pill", text: row.selected_answer || "Unknown" })]),
      el("td", { text: timeLabel(row.created_at) }),
    ]));
  });
  table.append(tbody);

  const chart = el("div");
  Object.entries(answerCounts).forEach(([answer, count]) => {
    chart.append(el("div", { className: "bar-row" }, [
      el("div", { className: "bar-label" }, [el("span", { text: answer }), el("span", { text: String(count) })]),
      el("div", { className: "bar" }, [el("span", { style: `width:${(count / maxAnswer) * 100}%` })]),
    ]));
  });

  shell.append(el("section", { className: "dash-main" }, [
    el("div", { className: "dash-panel" }, [el("h2", { text: "Latest answers" }), table]),
    el("div", { className: "dash-panel" }, [el("h2", { text: "Response mix" }), chart]),
  ]));
  root.append(shell);
}

async function init(forceAuth = false) {
  if (!config.url || !config.anonKey) {
    renderAuth("Add your Supabase URL and anon key in supabase-config.js first.");
    return;
  }
  const token = forceAuth ? localStorage.getItem("nyasa_admin_token") : getHashToken();
  if (!token) {
    renderAuth();
    return;
  }
  root.innerHTML = '<section class="auth-box dash-panel"><p class="eyebrow">Loading</p><h1 class="dash-title">Reading the signals...</h1></section>';
  try {
    renderDashboard(await fetchInteractions(token));
  } catch (error) {
    localStorage.removeItem("nyasa_admin_token");
    renderAuth(error.message);
  }
}

init();
