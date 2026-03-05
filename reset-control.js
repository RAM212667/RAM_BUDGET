(function () {
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

  const EMPTY_BY_KEY = {
    budget_tool_expenses_v1: "[]",
    budget_tool_pay_v1: "[]",
    budget_tool_people_v1: "[]",
    budget_tool_bank_profiles_v1: "[]",
    budget_tool_bank_forecast_v1: "[]",
    budget_tool_hourly_tracker_v1: "[]",
    budget_tool_goals_v1: "[]",
    budget_tool_incorporated_goal_v1: "null",
    budget_tool_budget_goal_field_v1: "null"
  };

  async function clearBackendStorage() {
    if (!window.location || !/^https?:$/i.test(window.location.protocol)) return;
    try {
      await fetch("/api/storage/all", { method: "DELETE" });
    } catch {
      // Keep going; local clear still works.
    }
  }

  function clearLocalBudgetStorage() {
    for (const key of KEYS) {
      try {
        localStorage.setItem(key, EMPTY_BY_KEY[key] || "null");
      } catch {
        // Ignore local storage errors.
      }
    }

    try {
      // Keep sync as ready so we do not immediately pull stale values back.
      sessionStorage.setItem("budget_tool_sync_ready_v1", "1");
    } catch {
      // Ignore session storage errors.
    }
  }

  async function performReset() {
    await clearBackendStorage();
    clearLocalBudgetStorage();
    window.location.href = "index.html?reset=1";
  }

  function wirePair(openBtn, control) {
    if (!openBtn || !control) return;

    const panel = control.querySelector("[data-reset-confirm-wrap]");
    const input = control.querySelector("[data-reset-input]");
    const confirmBtn = control.querySelector("[data-reset-confirm-btn]");
    const cancelBtn = control.querySelector("[data-reset-cancel-btn]");

    if (!panel || !input || !confirmBtn || !cancelBtn) return;

    const refreshConfirmState = () => {
      confirmBtn.disabled = input.value.trim() !== "RESET";
    };

    openBtn.addEventListener("click", event => {
      event.preventDefault();
      panel.classList.remove("hidden");
      input.value = "";
      refreshConfirmState();
      input.focus();
    });

    cancelBtn.addEventListener("click", event => {
      event.preventDefault();
      panel.classList.add("hidden");
      input.value = "";
      refreshConfirmState();
    });

    input.addEventListener("input", refreshConfirmState);

    confirmBtn.addEventListener("click", async event => {
      event.preventDefault();
      if (input.value.trim() !== "RESET") {
        refreshConfirmState();
        return;
      }
      confirmBtn.disabled = true;
      await performReset();
    });
  }

  function init() {
    const buttons = document.querySelectorAll("[data-reset-all]");
    buttons.forEach(btn => {
      const panel = btn.closest(".panel");
      const control = panel ? panel.querySelector("[data-reset-control]") : document.querySelector("[data-reset-control]");
      wirePair(btn, control);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
