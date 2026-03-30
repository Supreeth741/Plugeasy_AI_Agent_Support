let callsPage = 1;
let escalationsPage = 1;
let newEscalationCount = 0;

// Socket.IO connection
const socket = io();

socket.on("new-escalation", (data) => {
  newEscalationCount++;
  updateBadge();
  showToast(`New escalation from ${data.callerPhone}`);
  // Refresh escalations if on that tab
  const escTab = document.querySelector('[data-tab="escalations"]');
  if (escTab && escTab.classList.contains("active")) {
    loadEscalations();
  }
});

socket.on("escalation-resolved", () => {
  const escTab = document.querySelector('[data-tab="escalations"]');
  if (escTab && escTab.classList.contains("active")) {
    loadEscalations();
  }
});

function updateBadge() {
  const badge = document.getElementById("escalation-badge");
  if (newEscalationCount > 0) {
    badge.textContent = newEscalationCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 5000);
}

function switchTab(tab) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");

  document.getElementById("tab-calls").style.display =
    tab === "calls" ? "block" : "none";
  document.getElementById("tab-escalations").style.display =
    tab === "escalations" ? "block" : "none";

  if (tab === "calls") {
    loadCalls();
  } else {
    newEscalationCount = 0;
    updateBadge();
    loadEscalations();
  }
}

// --- Call Logs ---

async function loadCalls() {
  try {
    const result = await fetchJSON(`/calls?page=${callsPage}&limit=15`);
    const tbody = document.getElementById("calls-tbody");
    const empty = document.getElementById("calls-empty");

    if (result.data.length === 0) {
      tbody.innerHTML = "";
      empty.classList.remove("hidden");
    } else {
      empty.classList.add("hidden");
      tbody.innerHTML = result.data
        .map(
          (call) => `
        <tr>
          <td title="${call.callSid}">${call.callSid.slice(0, 12)}...</td>
          <td>${call.from}</td>
          <td>${formatDate(call.startTime)}</td>
          <td>${formatDuration(call.startTime, call.endTime)}</td>
          <td>${call.turnCount}</td>
          <td>${getLangLabel(call.detectedLanguage)}</td>
          <td><span class="status ${call.status}">${call.status}</span></td>
        </tr>
      `,
        )
        .join("");
    }

    renderPagination("calls-pagination", result.pagination, (p) => {
      callsPage = p;
      loadCalls();
    });
  } catch (err) {
    console.error("Failed to load calls:", err);
  }
}

// --- Escalations ---

async function loadEscalations() {
  try {
    const result = await fetchJSON(
      `/escalations?page=${escalationsPage}&limit=15`,
    );
    const list = document.getElementById("escalations-list");
    const empty = document.getElementById("escalations-empty");

    if (result.data.length === 0) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
    } else {
      empty.classList.add("hidden");
      list.innerHTML = result.data
        .map(
          (esc) => `
        <div class="escalation-item" onclick="window.location.href='escalation.html?id=${esc._id}'">
          <div class="escalation-info">
            <h3>${esc.callerPhone}</h3>
            <p>${esc.reason.length > 100 ? esc.reason.slice(0, 100) + "..." : esc.reason}</p>
            <p>${formatDate(esc.createdAt)}</p>
          </div>
          <span class="status ${esc.status}">${esc.status}</span>
        </div>
      `,
        )
        .join("");
    }

    renderPagination("escalations-pagination", result.pagination, (p) => {
      escalationsPage = p;
      loadEscalations();
    });
  } catch (err) {
    console.error("Failed to load escalations:", err);
  }
}

// --- Pagination ---

function renderPagination(containerId, pagination, onPageChange) {
  const container = document.getElementById(containerId);
  if (pagination.totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <button ${pagination.page <= 1 ? "disabled" : ""} onclick="void(0)" id="${containerId}-prev">
      Previous
    </button>
    <span>Page ${pagination.page} of ${pagination.totalPages}</span>
    <button ${pagination.page >= pagination.totalPages ? "disabled" : ""} onclick="void(0)" id="${containerId}-next">
      Next
    </button>
  `;

  document
    .getElementById(`${containerId}-prev`)
    .addEventListener("click", () => {
      if (pagination.page > 1) onPageChange(pagination.page - 1);
    });
  document
    .getElementById(`${containerId}-next`)
    .addEventListener("click", () => {
      if (pagination.page < pagination.totalPages)
        onPageChange(pagination.page + 1);
    });
}

// Initial load
loadCalls();
