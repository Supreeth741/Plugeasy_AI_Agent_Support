const params = new URLSearchParams(window.location.search);
const escalationId = params.get("id");

if (!escalationId) {
  window.location.href = "index.html";
}

let isResolved = false;

async function loadEscalation() {
  try {
    const esc = await fetchJSON(`/escalations/${escalationId}`);

    // Update header
    document.getElementById("caller-phone").textContent = esc.callerPhone;
    const statusEl = document.getElementById("escalation-status");
    statusEl.textContent = esc.status;
    statusEl.className = `status ${esc.status}`;

    isResolved = esc.status === "resolved";
    if (isResolved) {
      document.getElementById("resolve-btn").disabled = true;
      document.getElementById("resolve-btn").textContent = "Resolved";
      document.getElementById("chat-input-area").style.display = "none";
    }

    // Render transcript
    const transcriptEl = document.getElementById("transcript-messages");
    transcriptEl.innerHTML = esc.callTranscript
      .map(
        (msg) => `
      <div class="message ${msg.role}">
        <div>
          <div class="message-label">${msg.role === "user" ? "Customer" : "AI Agent"}</div>
          <div class="message-bubble">${escapeHtml(msg.content)}</div>
        </div>
      </div>
    `,
      )
      .join("");

    // Render chat history
    const chatEl = document.getElementById("chat-messages");
    const emptyEl = document.getElementById("chat-empty");

    if (esc.chatHistory && esc.chatHistory.length > 0) {
      emptyEl.style.display = "none";
      chatEl.innerHTML = esc.chatHistory
        .map(
          (msg) => `
        <div class="message ${msg.role}">
          <div>
            <div class="message-label">${msg.role === "admin" ? "You" : "AI Assistant"}</div>
            <div class="message-bubble">${escapeHtml(msg.content)}</div>
          </div>
        </div>
      `,
        )
        .join("");
      scrollToBottom();
    }
  } catch (err) {
    console.error("Failed to load escalation:", err);
    document.getElementById("caller-phone").textContent =
      "Error loading escalation";
  }
}

async function sendMessage() {
  if (isResolved) return;

  const input = document.getElementById("message-input");
  const message = input.value.trim();
  if (!message) return;

  const sendBtn = document.getElementById("send-btn");
  sendBtn.disabled = true;
  input.disabled = true;
  input.value = "";

  // Show admin message immediately
  appendMessage("admin", message);

  // Show loading indicator
  const loadingId = appendLoading();

  try {
    const result = await fetchJSON(`/escalations/${escalationId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });

    // Remove loading and show AI response
    removeLoading(loadingId);
    appendMessage("ai", result.aiResponse);
  } catch (err) {
    removeLoading(loadingId);
    appendMessage("ai", "Error: " + err.message);
  } finally {
    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
  }
}

function appendMessage(role, content) {
  const chatEl = document.getElementById("chat-messages");
  const emptyEl = document.getElementById("chat-empty");
  emptyEl.style.display = "none";

  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.innerHTML = `
    <div>
      <div class="message-label">${role === "admin" ? "You" : "AI Assistant"}</div>
      <div class="message-bubble">${escapeHtml(content)}</div>
    </div>
  `;
  chatEl.appendChild(div);
  scrollToBottom();
}

let loadingCounter = 0;

function appendLoading() {
  const chatEl = document.getElementById("chat-messages");
  const id = `loading-${++loadingCounter}`;
  const div = document.createElement("div");
  div.id = id;
  div.className = "message ai";
  div.innerHTML = `
    <div>
      <div class="message-label">AI Assistant</div>
      <div class="message-bubble"><span class="spinner"></span> Thinking...</div>
    </div>
  `;
  chatEl.appendChild(div);
  scrollToBottom();
  return id;
}

function removeLoading(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

async function resolveEscalation() {
  if (isResolved) return;

  try {
    await fetchJSON(`/escalations/${escalationId}/resolve`, {
      method: "PATCH",
    });

    isResolved = true;
    document.getElementById("resolve-btn").disabled = true;
    document.getElementById("resolve-btn").textContent = "Resolved";
    document.getElementById("chat-input-area").style.display = "none";

    const statusEl = document.getElementById("escalation-status");
    statusEl.textContent = "resolved";
    statusEl.className = "status resolved";
  } catch (err) {
    console.error("Failed to resolve:", err);
  }
}

function scrollToBottom() {
  const chatEl = document.getElementById("chat-messages");
  chatEl.scrollTop = chatEl.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initial load
loadEscalation();
