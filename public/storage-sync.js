(function () {
  const API_BASE = "/api/storage";
  const KEYS = [
    "budget_tool_expenses_v1",
    "budget_tool_pay_v1",
    "budget_tool_people_v1",
    "budget_tool_bank_profiles_v1",
    "budget_tool_bank_forecast_v1",
    "budget_tool_hourly_tracker_v1",
    "budget_tool_goals_v1",
    "budget_tool_incorporated_goal_v1",
    "budget_tool_budget_goal_field_v1"
  ];

  function canUseBackend() {
    return typeof window !== "undefined" && window.location && /^https?:$/i.test(window.location.protocol);
  }

  async function pullServerData() {
    try {
      const response = await fetch(`${API_BASE}/all`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      const data = (payload && payload.data) || {};
      for (const key of KEYS) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
        try {
          localStorage.setItem(key, String(data[key]));
        } catch {
          // Ignore local write errors.
        }
      }
    } catch {
      // Ignore backend unavailability.
    }
  }

  function pushKeyToServer(key, value) {
    if (!canUseBackend()) return;
    if (!KEYS.includes(key)) return;

    fetch(`${API_BASE}/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value })
    }).catch(() => {
      // Ignore sync failures; local copy still exists.
    });
  }

  function deleteKeyFromServer(key) {
    if (!canUseBackend()) return;
    if (!KEYS.includes(key)) return;

    fetch(`${API_BASE}/${encodeURIComponent(key)}`, {
      method: "DELETE"
    }).catch(() => {
      // Ignore sync failures.
    });
  }

  if (canUseBackend()) {
    const originalSet = localStorage.setItem.bind(localStorage);
    const originalRemove = localStorage.removeItem.bind(localStorage);
    const originalClear = localStorage.clear.bind(localStorage);

    localStorage.setItem = function (key, value) {
      originalSet(key, value);
      pushKeyToServer(String(key), String(value));
    };

    localStorage.removeItem = function (key) {
      originalRemove(key);
      deleteKeyFromServer(String(key));
    };

    localStorage.clear = function () {
      originalClear();
      fetch(`${API_BASE}/all`, { method: "DELETE" }).catch(() => {});
    };

    if (!sessionStorage.getItem("budget_tool_sync_ready_v1")) {
      pullServerData().finally(() => {
        sessionStorage.setItem("budget_tool_sync_ready_v1", "1");
        if (!window.location.search.includes("sync=1")) {
          const sep = window.location.search ? "&" : "?";
          window.location.replace(`${window.location.pathname}${window.location.search}${sep}sync=1`);
        }
      });
    }
  }
})();

