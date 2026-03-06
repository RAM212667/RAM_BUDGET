(function () {
  const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  function ensureStyles() {
    if (document.getElementById("month-year-picker-style")) return;
    const style = document.createElement("style");
    style.id = "month-year-picker-style";
    style.textContent = `
      .month-year-control {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .month-year-control select {
        width: 100%;
      }

      input.month-year-source {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function parseMonthValue(value) {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
    return { year: value.slice(0, 4), month: value.slice(5, 7) };
  }

  function currentMonthValue() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function buildYearOptions(select, selectedYear) {
    const baseYear = new Date().getFullYear();
    const years = [];
    for (let y = baseYear - 10; y <= baseYear + 15; y += 1) years.push(String(y));
    if (selectedYear && !years.includes(selectedYear)) years.push(selectedYear);
    years.sort((a, b) => Number(a) - Number(b));

    select.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join("");
    select.value = selectedYear || String(baseYear);
  }

  function wireInput(input) {
    if (input.dataset.monthDropdownEnhanced === "1") return;
    input.dataset.monthDropdownEnhanced = "1";

    const value = parseMonthValue(input.value) || parseMonthValue(currentMonthValue());
    input.value = `${value.year}-${value.month}`;

    const wrap = document.createElement("div");
    wrap.className = "month-year-control";

    const monthSelect = document.createElement("select");
    monthSelect.setAttribute("aria-label", "Month");
    monthSelect.innerHTML = MONTHS.map(m => `<option value="${m.value}">${m.label}</option>`).join("");
    monthSelect.value = value.month;

    const yearSelect = document.createElement("select");
    yearSelect.setAttribute("aria-label", "Year");
    buildYearOptions(yearSelect, value.year);

    const syncToInput = () => {
      const next = `${yearSelect.value}-${monthSelect.value}`;
      if (input.value !== next) {
        input.value = next;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };

    monthSelect.addEventListener("change", syncToInput);
    yearSelect.addEventListener("change", syncToInput);

    const syncFromInput = () => {
      const parsed = parseMonthValue(input.value);
      if (!parsed) return;
      if (monthSelect.value !== parsed.month) monthSelect.value = parsed.month;
      if (yearSelect.value !== parsed.year) buildYearOptions(yearSelect, parsed.year);
      if (yearSelect.value !== parsed.year) yearSelect.value = parsed.year;
    };

    input.addEventListener("change", syncFromInput);
    input.addEventListener("input", syncFromInput);

    setInterval(syncFromInput, 350);

    input.classList.add("month-year-source");
    input.insertAdjacentElement("beforebegin", wrap);
    wrap.appendChild(monthSelect);
    wrap.appendChild(yearSelect);
  }

  function init() {
    ensureStyles();
    const monthInputs = document.querySelectorAll('input[type="month"]');
    monthInputs.forEach(wireInput);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
