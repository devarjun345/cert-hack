const API_BASE_URL = "http://127.0.0.1:8000";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const HISTORY_LIMIT = 100;
const HISTORY_PAGE_SIZE = 10;
const ACTIVE_SESSION_KEY = "grimoire.active-session.v1";
const LAST_RESULT_KEY = "grimoire.last-result.v1";

const app = document.getElementById("app");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const menuButton = document.getElementById("menu-button");
const sidebarClose = document.getElementById("sidebar-close");
const systemStatusName = document.getElementById("system-status-name");
const systemStatusDot = document.getElementById("system-status-dot");
const toastRegion = document.getElementById("toast-region");

const state = {
  document: null,
  selectedFile: null,
  quiz: null,
  answers: {},
  flags: [],
  currentQuestion: 0,
  durationSeconds: 20 * 60,
  startedAt: null,
  deadline: null,
  timeoutReached: false,
  timerId: null,
  isSubmitting: false,
  historyItems: [],
  historyFilter: "",
  historySort: "recent",
  historyPage: 1,
  lastResult: null,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message, type = "info", duration = 5000) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.textContent = message;
  toastRegion.appendChild(toast);
  window.setTimeout(() => toast.remove(), duration);
}

async function requestJson(path, options = {}) {
  let response;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The API request timed out. Check that the backend is running and try again.");
    }
    throw new Error(`Could not connect to the Grimoire API at ${API_BASE_URL}. Check that the backend is running and try again.`);
  } finally {
    window.clearTimeout(timeoutId);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.detail || `Request failed (${response.status})`);
  }

  return payload;
}

function setSystemStatus(online) {
  systemStatusName.textContent = online ? "ONLINE" : "OFFLINE";
  systemStatusDot.className = `status-dot ${online ? "online" : "offline"}`;
  systemStatusDot.setAttribute("aria-label", online ? "API online" : "API offline");
}

async function checkSystemStatus() {
  try {
    await requestJson("/");
    setSystemStatus(true);
  } catch {
    setSystemStatus(false);
  }
}

function formatAccuracy(value) {
  const accuracy = Number(value);
  return Number.isFinite(accuracy) ? `${accuracy.toFixed(1)}%` : "0.0%";
}

function formatAttemptDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function accuracyClass(value) {
  const accuracy = Number(value);
  if (accuracy >= 80) return "accuracy-good";
  if (accuracy >= 60) return "accuracy-average";
  return "accuracy-low";
}

function attemptAccuracy(item) {
  const accuracy = Number(item.accuracy);
  if (item.accuracy !== null && item.accuracy !== undefined && item.accuracy !== "" && Number.isFinite(accuracy)) {
    return Math.max(0, Math.min(100, accuracy));
  }
  const score = Number(item.score);
  const total = Number(item.total_questions);
  return Number.isFinite(score) && Number.isFinite(total) && total > 0
    ? Math.max(0, Math.min(100, (score / total) * 100))
    : 0;
}

function readStorage(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast("Session storage is unavailable. Your current progress may not survive a page refresh.", "error");
  }
}

function safeQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions.map((question) => ({
    id: String(question.id),
    question: String(question.question || ""),
    options: Array.isArray(question.options)
      ? question.options.map((option) => ({
          id: String(option.id),
          text: String(option.text || ""),
        }))
      : [],
  }));
}

function persistActiveSession() {
  if (!state.document && !state.quiz) return;
  writeStorage(ACTIVE_SESSION_KEY, {
    document: state.document,
    quiz: state.quiz ? {
      quiz_id: state.quiz.quiz_id,
      document_id: state.quiz.document_id,
      mode: state.quiz.mode,
      difficulty: state.quiz.difficulty,
      questions: safeQuestions(state.quiz.questions),
    } : null,
    answers: state.answers,
    flags: state.flags,
    currentQuestion: state.currentQuestion,
    durationSeconds: state.durationSeconds,
    startedAt: state.startedAt,
    deadline: state.deadline,
    timeoutReached: state.timeoutReached,
  });
}

function restoreSession() {
  const saved = readStorage(ACTIVE_SESSION_KEY);
  if (!saved || typeof saved !== "object") return;
  state.document = saved.document || null;
  state.quiz = saved.quiz || null;
  state.answers = saved.answers && typeof saved.answers === "object" ? saved.answers : {};
  state.flags = Array.isArray(saved.flags) ? saved.flags : [];
  state.currentQuestion = Number.isInteger(saved.currentQuestion) ? saved.currentQuestion : 0;
  state.durationSeconds = Number(saved.durationSeconds) || 20 * 60;
  state.startedAt = Number(saved.startedAt) || null;
  state.deadline = Number(saved.deadline) || null;
  state.timeoutReached = Boolean(saved.timeoutReached);
  state.lastResult = readStorage(LAST_RESULT_KEY);

  if (state.quiz && (!Array.isArray(state.quiz.questions) || !state.quiz.quiz_id)) {
    clearActiveSession();
  }
}

function clearActiveSession() {
  state.document = null;
  state.quiz = null;
  state.answers = {};
  state.flags = [];
  state.currentQuestion = 0;
  state.startedAt = null;
  state.deadline = null;
  state.timeoutReached = false;
  state.isSubmitting = false;
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
  try {
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // Keep the app usable if browser storage is disabled.
  }
}

function dashboardTemplate(items) {
  const averageAccuracy = items.length
    ? items.reduce((sum, item) => sum + (Number(item.accuracy) || 0), 0) / items.length
    : 0;
  const uniqueDocuments = new Set(items.map((item) => item.document_name).filter(Boolean)).size;
  const recentAttempts = items.slice(0, 5);
  const topAttempts = items.slice().sort((first, second) => {
    const accuracyDifference = attemptAccuracy(second) - attemptAccuracy(first);
    if (accuracyDifference !== 0) return accuracyDifference;
    const scoreDifference = Number(second.score || 0) - Number(first.score || 0);
    if (scoreDifference !== 0) return scoreDifference;
    return new Date(second.attempted_at || 0) - new Date(first.attempted_at || 0);
  }).slice(0, 5);
  const rows = recentAttempts.length
    ? recentAttempts.map((item) => `
        <article class="attempt-row">
          <div class="attempt-name">
            <strong title="${escapeHtml(item.document_name || "Untitled document")}">${escapeHtml(item.document_name || "Untitled document")}</strong>
            <span>Attempt #${escapeHtml(item.attempt_id ?? "—")}</span>
          </div>
          <span class="attempt-score">${escapeHtml(item.score ?? 0)}/${escapeHtml(item.total_questions ?? 0)}</span>
          <span class="status-badge ${accuracyClass(item.accuracy)}">${escapeHtml(formatAccuracy(item.accuracy))}</span>
          <span class="attempt-meta">${escapeHtml(formatAttemptDate(item.attempted_at))}</span>
          <a class="secondary-action" href="#history">History</a>
        </article>
      `).join("")
    : `
      <div class="empty-state">
        <span class="material-symbols-outlined" aria-hidden="true">quiz</span>
        <h3>No completed quizzes yet</h3>
        <p>Upload a text-based PDF and generate your first quiz to begin building attempt history.</p>
        <a class="primary-action" href="#upload">Upload PDF</a>
      </div>
    `;

  return `
    <section class="dashboard" aria-labelledby="dashboard-title">
      <div class="hero-grid">
        <article class="hero-card">
          <div>
            <div class="hero-badges">
              <span class="badge badge-primary">Study workspace</span>
              <span class="badge badge-tertiary">PDF-to-quiz</span>
            </div>
            <h1 id="dashboard-title">Turn study notes into practice</h1>
            <p>Upload lecture notes and study PDFs to create multiple-choice quizzes, then review your results and attempt history.</p>
          </div>
          <div class="workflow" aria-label="Quiz workflow">
            <div class="workflow-step"><span class="step-number">01</span><span>Ingest PDF</span></div>
            <div class="workflow-step"><span class="step-number">02</span><span>Configure quiz</span></div>
            <div class="workflow-step"><span class="step-number">03</span><span>Test knowledge</span></div>
          </div>
        </article>
        <aside class="upload-card">
          <div>
            <div class="upload-card-icon"><span class="material-symbols-outlined" aria-hidden="true">upload_file</span></div>
            <h2>Upload new PDF</h2>
            <p>Extract text from a supported document and configure a focused quiz.</p>
          </div>
          <a class="primary-action" href="#upload">Start a quiz</a>
        </aside>
      </div>
      <div class="stats-grid" aria-label="Recent quiz summary">
        <article class="stat-card">
          <div><span class="stat-label">Attempts loaded</span><span class="stat-value">${items.length}</span></div>
          <div class="stat-icon" aria-hidden="true"><span class="material-symbols-outlined">quiz</span></div>
        </article>
        <article class="stat-card">
          <div><span class="stat-label">Average accuracy</span><span class="stat-value">${formatAccuracy(averageAccuracy)}</span></div>
          <div class="stat-icon" aria-hidden="true"><span class="material-symbols-outlined">insights</span></div>
        </article>
        <article class="stat-card">
          <div><span class="stat-label">Documents represented</span><span class="stat-value">${uniqueDocuments}</span></div>
          <div class="stat-icon" aria-hidden="true"><span class="material-symbols-outlined">description</span></div>
        </article>
      </div>
      <section class="scoreboard-panel" aria-labelledby="scoreboard-title">
        <header class="panel-header">
          <div>
            <h2 id="scoreboard-title">Scoreboard</h2>
            <p>Highest-accuracy attempts from recent history</p>
          </div>
          <span class="badge badge-tertiary">TOP 5</span>
        </header>
        ${topAttempts.length ? `
          <ol class="scoreboard-list">
            ${topAttempts.map((item, index) => {
              const accuracy = attemptAccuracy(item);
              const total = Number(item.total_questions) || 0;
              const score = Number(item.score) || 0;
              const progress = Math.round(accuracy);
              return `
                <li class="scoreboard-row">
                  <span class="score-rank rank-${Math.min(index + 1, 3)}" aria-label="Rank ${index + 1}">${String(index + 1).padStart(2, "0")}</span>
                  <div class="score-entry">
                    <strong title="${escapeHtml(item.document_name || "Untitled document")}">${escapeHtml(item.document_name || "Untitled document")}</strong>
                    <span>Attempt #${escapeHtml(item.attempt_id ?? "—")} · ${escapeHtml(formatAttemptDate(item.attempted_at))}</span>
                    <div class="score-track" role="progressbar" aria-label="Accuracy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
                      <span style="width: ${progress}%"></span>
                    </div>
                  </div>
                  <strong class="score-value">${escapeHtml(score)}<small> / ${escapeHtml(total)}</small></strong>
                  <span class="status-badge ${accuracyClass(accuracy)}">${escapeHtml(formatAccuracy(accuracy))}</span>
                </li>
              `;
            }).join("")}
          </ol>
        ` : `
          <div class="scoreboard-empty">
            <span class="material-symbols-outlined" aria-hidden="true">emoji_events</span>
            <div><strong>Your scoreboard is waiting</strong><span>Complete a quiz to add the first scored attempt.</span></div>
            <a class="panel-action" href="#upload">Create a quiz</a>
          </div>
        `}
      </section>
      <section class="recent-panel" aria-labelledby="recent-title">
        <header class="panel-header">
          <div><h2 id="recent-title">Recent attempts</h2><p>Most recent completed results returned by the API</p></div>
          <a class="panel-action" href="#history">View history</a>
        </header>
        <div class="attempt-list">${rows}</div>
      </section>
    </section>
  `;
}

async function renderDashboard() {
  app.innerHTML = loadingTemplate("Loading dashboard");
  try {
    const payload = await requestJson(`/api/history?limit=${HISTORY_LIMIT}`);
    const items = Array.isArray(payload?.items) ? payload.items : [];
    setSystemStatus(true);
    app.innerHTML = dashboardTemplate(items);
  } catch (error) {
    setSystemStatus(false);
    app.innerHTML = `
      <section class="error-page-card">
        <span class="material-symbols-outlined" aria-hidden="true">cloud_off</span>
        <h1>Dashboard could not load</h1>
        <p>${escapeHtml(error.message)}</p>
        <button class="button button-primary" type="button" id="dashboard-retry">Try again</button>
      </section>
    `;
    document.getElementById("dashboard-retry").addEventListener("click", renderDashboard);
  }
}

function loadingTemplate(message) {
  return `<div class="loading-page" role="status"><span class="material-symbols-outlined spinning" aria-hidden="true">progress_activity</span>${escapeHtml(message)}</div>`;
}

function uploadTemplate() {
  const activeDocument = state.document;
  return `
    <section class="page-section" aria-labelledby="upload-title">
      <header class="page-banner">
        <div class="page-banner-icon"><span class="material-symbols-outlined" aria-hidden="true">upload_file</span></div>
        <div>
          <span class="eyebrow">01 / DOCUMENT INGESTION</span>
          <h1 id="upload-title">Upload and configure</h1>
          <p>Upload a text-based PDF. Scanned documents requiring OCR are not supported in this MVP.</p>
        </div>
      </header>
      <div class="upload-layout">
        <section class="panel upload-panel" aria-labelledby="source-title">
          <div class="section-heading">
            <h2 id="source-title">Source PDF</h2>
            <span class="helper-label">PDF ONLY · MAX 50 MB</span>
          </div>
          <div class="drop-zone" id="drop-zone" tabindex="0" role="button" aria-label="Choose a PDF file or drag it here">
            <input id="file-input" class="visually-hidden" type="file" accept=".pdf,application/pdf">
            <span class="drop-icon material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>
            <strong>Drop your PDF here</strong>
            <span>or <span class="link-text">browse files</span></span>
            <span class="helper-label">Text-based PDFs only. Uploads are validated by the server.</span>
          </div>
          <div class="selected-file ${state.selectedFile ? "visible" : ""}" id="selected-file" ${state.selectedFile ? "" : "hidden"}>
            <span class="material-symbols-outlined" aria-hidden="true">description</span>
            <span class="selected-file-name" id="selected-file-name">${escapeHtml(state.selectedFile?.name || "")}</span>
            <span class="selected-file-size" id="selected-file-size">${state.selectedFile ? formatFileSize(state.selectedFile.size) : ""}</span>
            <button type="button" class="icon-button" id="remove-file" aria-label="Remove selected file"><span class="material-symbols-outlined">close</span></button>
          </div>
          <div class="progress-wrap" id="upload-progress-wrap" hidden>
            <div class="progress-label"><span id="upload-status">Uploading and extracting…</span><span id="upload-progress-value">0%</span></div>
            <div class="progress-track"><div class="progress-bar" id="upload-progress-bar"></div></div>
          </div>
          <div class="form-error" id="upload-error" role="alert" hidden></div>
          <button type="button" class="button button-primary button-wide" id="upload-button" ${state.selectedFile ? "" : "disabled"}>
            <span class="material-symbols-outlined" aria-hidden="true">cloud_upload</span>
            Upload and extract
          </button>
          ${activeDocument ? `
            <div class="document-success" role="status">
              <span class="material-symbols-outlined" aria-hidden="true">task_alt</span>
              <div><strong>${escapeHtml(activeDocument.filename)}</strong><span>${escapeHtml(activeDocument.page_count)} pages · Ready to configure</span></div>
            </div>
          ` : ""}
        </section>
        <section class="panel config-panel" aria-labelledby="config-title">
          <div class="section-heading">
            <h2 id="config-title">Quiz settings</h2>
            <span class="helper-label">02 / CONFIGURATION</span>
          </div>
          <form id="quiz-config-form">
            <fieldset class="control-group">
              <legend>Question count</legend>
              <div class="segmented-control count-options">
                ${[5, 10, 15, 20].map((count) => `<button type="button" class="segment ${count === 10 ? "selected" : ""}" data-count="${count}" aria-pressed="${count === 10}">${count}</button>`).join("")}
              </div>
            </fieldset>
            <fieldset class="control-group">
              <legend>Difficulty</legend>
              <div class="segmented-control difficulty-options">
                ${["easy", "medium", "hard"].map((difficulty) => `<button type="button" class="segment ${difficulty === "medium" ? "selected" : ""}" data-difficulty="${difficulty}" aria-pressed="${difficulty === "medium"}">${capitalize(difficulty)}</button>`).join("")}
              </div>
            </fieldset>
            <fieldset class="control-group">
              <legend>Quiz mode</legend>
              <div class="mode-options">
                <label class="mode-card selected">
                  <input type="radio" name="mode" value="study" checked>
                  <span class="mode-title"><span class="material-symbols-outlined" aria-hidden="true">school</span>Study mode</span>
                  <span class="mode-description">Work through questions and review feedback after submitting.</span>
                </label>
                <label class="mode-card">
                  <input type="radio" name="mode" value="exam">
                  <span class="mode-title"><span class="material-symbols-outlined" aria-hidden="true">timer</span>Exam mode</span>
                  <span class="mode-description">Timed assessment. Correct answers stay hidden until submission.</span>
                </label>
              </div>
            </fieldset>
            <fieldset class="control-group">
              <label for="duration-select">Time limit</label>
              <select id="duration-select" class="select-control">
                <option value="600">10 minutes</option>
                <option value="1200" selected>20 minutes</option>
                <option value="1800">30 minutes</option>
              </select>
              <span class="field-help">The timer is enforced in this browser session.</span>
            </fieldset>
            <div class="form-error" id="generate-error" role="alert" hidden></div>
            <button class="button button-secondary button-wide" id="generate-button" type="submit" ${activeDocument ? "" : "disabled"}>
              <span class="material-symbols-outlined" aria-hidden="true">bolt</span>
              Generate quiz
            </button>
          </form>
        </section>
      </div>
      ${activeDocument?.text_preview ? `
        <section class="panel preview-panel" aria-labelledby="preview-title">
          <div class="section-heading">
            <h2 id="preview-title">Extracted text preview</h2>
            <span class="status-badge accuracy-good">${escapeHtml(activeDocument.extraction_status || "success")}</span>
          </div>
          <div class="document-meta"><span>${escapeHtml(activeDocument.filename)}</span><span>${escapeHtml(activeDocument.page_count)} pages</span></div>
          <pre class="text-preview">${escapeHtml(activeDocument.text_preview)}</pre>
        </section>
      ` : ""}
    </section>
  `;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validatePdf(file) {
  if (!file) return "Choose a PDF file first.";
  if (!file.name.toLowerCase().endsWith(".pdf")) return "Only PDF files are supported.";
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return "The selected PDF exceeds the 50 MB upload limit.";
  return "";
}

function displayFormError(id, message) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
}

function setSelectedFile(file) {
  const error = validatePdf(file);
  if (error) {
    state.selectedFile = null;
    showToast(error, "error");
    renderUpload();
    return;
  }
  state.selectedFile = file;
  renderUpload();
}

function uploadPdf(file, progressCallback) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE_URL}/api/upload-pdf`);
    request.responseType = "json";
    request.timeout = 120000;

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) progressCallback(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      const payload = request.response;
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(payload?.detail || `Upload failed (${request.status})`));
        return;
      }
      if (!payload?.document_id) {
        reject(new Error("The server response did not include a document ID."));
        return;
      }
      resolve(payload);
    });
    request.addEventListener("error", () => reject(new Error(`Could not connect to the Grimoire API at ${API_BASE_URL}. Check that the backend is running and try again.`)));
    request.addEventListener("timeout", () => reject(new Error("Upload timed out. Check your connection and try again.")));

    const body = new FormData();
    body.append("file", file);
    request.send(body);
  });
}

async function handleUpload() {
  const file = state.selectedFile;
  const validationError = validatePdf(file);
  if (validationError) {
    displayFormError("upload-error", validationError);
    return;
  }

  const button = document.getElementById("upload-button");
  const progressWrap = document.getElementById("upload-progress-wrap");
  const progressBar = document.getElementById("upload-progress-bar");
  const progressValue = document.getElementById("upload-progress-value");
  const status = document.getElementById("upload-status");
  button.disabled = true;
  button.innerHTML = '<span class="material-symbols-outlined spinning" aria-hidden="true">progress_activity</span> Uploading PDF';
  progressWrap.hidden = false;
  displayFormError("upload-error", "");

  try {
    const result = await uploadPdf(file, (percentage) => {
      progressBar.style.width = `${percentage}%`;
      progressValue.textContent = `${percentage}%`;
      if (percentage >= 100) status.textContent = "Extracting document text…";
    });
    state.document = {
      document_id: result.document_id,
      filename: result.filename || file.name,
      page_count: result.page_count ?? 0,
      extraction_status: result.extraction_status || "success",
      text_preview: result.text_preview || "",
    };
    state.selectedFile = null;
    persistActiveSession();
    showToast("PDF uploaded and extracted successfully.", "success");
    renderUpload();
  } catch (error) {
    displayFormError("upload-error", error.message);
    button.disabled = false;
    button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">cloud_upload</span> Try upload again';
    status.textContent = "Upload failed";
    progressBar.classList.add("progress-bar-error");
    setSystemStatus(false);
  }
}

function setSegmentSelection(button, selector) {
  document.querySelectorAll(selector).forEach((item) => {
    const selected = item === button;
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
}

async function handleGenerate(event) {
  event.preventDefault();
  const errorElement = document.getElementById("generate-error");
  if (!state.document?.document_id) {
    displayFormError("generate-error", "Upload and extract a PDF before generating a quiz.");
    return;
  }

  const button = document.getElementById("generate-button");
  const count = Number(document.querySelector(".count-options .selected")?.dataset.count || 10);
  const difficulty = document.querySelector(".difficulty-options .selected")?.dataset.difficulty || "medium";
  const mode = document.querySelector('input[name="mode"]:checked')?.value || "study";
  const durationSeconds = Number(document.getElementById("duration-select").value) || 1200;

  displayFormError("generate-error", "");
  button.disabled = true;
  button.innerHTML = '<span class="material-symbols-outlined spinning" aria-hidden="true">progress_activity</span> Generating questions';

  try {
    const result = await requestJson("/api/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_id: state.document.document_id,
        question_count: count,
        difficulty,
        mode,
      }),
    });
    const questions = safeQuestions(result?.questions);
    if (!result?.quiz_id || !questions.length) {
      throw new Error("The server did not return a quiz with any questions. Try fewer questions or a different PDF.");
    }
    if (questions.some((question) => !question.id || question.id === "undefined" || question.id === "null" || !question.question || question.options.length !== 4
      || new Set(question.options.map((option) => option.id)).size !== 4
      || question.options.some((option) => !option.id || option.id === "undefined" || option.id === "null" || !option.text))) {
      throw new Error("The server returned an invalid question. Please try generating the quiz again.");
    }

    state.quiz = {
      quiz_id: result.quiz_id,
      document_id: result.document_id || state.document.document_id,
      mode: result.mode || mode,
      difficulty: result.difficulty || difficulty,
      questions,
    };
    state.answers = {};
    state.flags = [];
    state.currentQuestion = 0;
    state.durationSeconds = durationSeconds;
    state.startedAt = Date.now();
    state.deadline = state.startedAt + durationSeconds * 1000;
    state.timeoutReached = false;
    state.isSubmitting = false;
    persistActiveSession();
    window.location.hash = "#quiz";
  } catch (error) {
    displayFormError("generate-error", error.message);
    button.disabled = false;
    button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">bolt</span> Try generating again';
    if (error.message.includes("connect to the Grimoire API")) setSystemStatus(false);
  }
}

function quizTemplate() {
  const quiz = state.quiz;
  const question = quiz.questions[state.currentQuestion];
  const total = quiz.questions.length;
  const answeredCount = Object.keys(state.answers).length;
  const isFlagged = state.flags.includes(question.id);
  const options = question.options.map((option) => {
    const selected = state.answers[question.id] === option.id;
    return `
      <label class="answer-option ${selected ? "selected" : ""}">
        <input type="radio" name="answer" value="${escapeHtml(option.id)}" ${selected ? "checked" : ""} aria-label="${escapeHtml(option.id)}: ${escapeHtml(option.text)}">
        <span class="option-key">${escapeHtml(option.id)}</span>
        <span class="option-copy">${escapeHtml(option.text)}</span>
      </label>
    `;
  }).join("");

  const navigator = quiz.questions.map((item, index) => {
    const answered = Object.prototype.hasOwnProperty.call(state.answers, item.id);
    return `
      <button type="button" class="question-number ${index === state.currentQuestion ? "current" : ""} ${answered ? "answered" : ""} ${state.flags.includes(item.id) ? "flagged" : ""}"
        data-question-index="${index}" aria-label="Go to question ${index + 1}${answered ? ", answered" : ", unanswered"}${state.flags.includes(item.id) ? ", flagged" : ""}"
        aria-current="${index === state.currentQuestion ? "step" : "false"}">
        ${index + 1}
      </button>
    `;
  }).join("");

  return `
    <section class="page-section quiz-page" aria-labelledby="quiz-title">
      <header class="quiz-status-bar">
        <div class="quiz-heading">
          <span class="badge badge-primary">${escapeHtml((quiz.mode || "exam").toUpperCase())} MODE</span>
          <h1 id="quiz-title">${escapeHtml(state.document?.filename || "Active quiz")}</h1>
          <span class="helper-label">${total} QUESTIONS · ${escapeHtml(capitalize(quiz.difficulty || "medium"))}</span>
        </div>
        <div class="timer-card" role="timer" aria-label="Time remaining">
          <span class="material-symbols-outlined" aria-hidden="true">timer</span>
          <div><span class="timer-label">TIME REMAINING</span><strong id="countdown-timer">${formatDuration(Math.ceil(Math.max(0, state.deadline - Date.now()) / 1000))}</strong></div>
        </div>
      </header>
      <div class="quiz-layout">
        <div class="question-column">
          <div class="question-meta">
            <span class="badge badge-tertiary">QUESTION ${state.currentQuestion + 1} OF ${total}</span>
            <span class="answered-label">${answeredCount} ANSWERED</span>
            <button type="button" class="button button-quiet ${isFlagged ? "flag-active" : ""}" id="flag-question" aria-pressed="${isFlagged}">
              <span class="material-symbols-outlined" aria-hidden="true">flag</span>${isFlagged ? "Flagged" : "Flag for review"}
            </button>
          </div>
          <article class="question-card">
            <h2>${escapeHtml(question.question)}</h2>
            <fieldset class="answer-list">
              <legend class="visually-hidden">Choose one answer</legend>
              ${options}
            </fieldset>
          </article>
          <div class="quiz-controls">
            <button type="button" class="button button-neutral" id="previous-question" ${state.currentQuestion === 0 ? "disabled" : ""}>
              <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>Previous
            </button>
            ${state.currentQuestion < total - 1
              ? `<button type="button" class="button button-secondary" id="next-question">Next<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>`
              : `<button type="button" class="button button-primary" id="submit-quiz">Submit quiz<span class="material-symbols-outlined" aria-hidden="true">send</span></button>`}
          </div>
        </div>
        <aside class="navigator-panel panel" aria-labelledby="navigator-title">
          <div class="section-heading"><h2 id="navigator-title">Question navigator</h2><span class="helper-label">${answeredCount}/${total} ANSWERED</span></div>
          <div class="question-matrix">${navigator}</div>
          <div class="navigator-legend">
            <span><i class="legend-current"></i>Current</span>
            <span><i class="legend-answered"></i>Answered</span>
            <span><i class="legend-flagged"></i>Flagged</span>
          </div>
          <div class="quiz-mode-note">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>
            ${quiz.mode === "study" ? "Answers and explanations are shown after submission." : "Correct answers remain hidden until your submission is evaluated."}
          </div>
          <button type="button" class="button button-secondary button-wide" id="navigator-submit">Submit quiz</button>
        </aside>
      </div>
    </section>
  `;
}

function setAnswer(questionId, optionId) {
  state.answers[questionId] = optionId;
  persistActiveSession();
  renderQuiz();
}

function startQuizTimer() {
  if (!state.quiz || !state.deadline) return;
  if (state.deadline <= Date.now()) {
    const timer = document.getElementById("countdown-timer");
    if (timer) timer.textContent = "00:00";
    if (!state.timeoutReached && !state.isSubmitting) {
      state.timeoutReached = true;
      persistActiveSession();
      submitQuiz(true);
    }
    return;
  }
  state.timerId = window.setInterval(() => {
    const remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    const timer = document.getElementById("countdown-timer");
    if (timer) {
      timer.textContent = formatDuration(remaining);
      timer.classList.toggle("timer-warning", remaining <= 60);
    }
    if (remaining <= 0 && !state.timeoutReached) {
      state.timeoutReached = true;
      persistActiveSession();
      window.clearInterval(state.timerId);
      state.timerId = null;
      submitQuiz(true);
    }
  }, 1000);
}

function goToQuestion(index) {
  if (!state.quiz) return;
  state.currentQuestion = Math.max(0, Math.min(index, state.quiz.questions.length - 1));
  persistActiveSession();
  renderQuiz();
}

async function submitQuiz(isTimeout = false) {
  if (!state.quiz || state.isSubmitting) return;
  const unanswered = state.quiz.questions.length - Object.keys(state.answers).length;
  if (!isTimeout && unanswered > 0) {
    const confirmed = window.confirm(`You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit your quiz anyway?`);
    if (!confirmed) return;
  }

  state.isSubmitting = true;
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
  const submitButtons = document.querySelectorAll("#submit-quiz, #navigator-submit");
  submitButtons.forEach((button) => {
    button.disabled = true;
    button.textContent = isTimeout ? "Time expired — submitting…" : "Submitting…";
  });

  const timeTaken = Math.min(
    state.durationSeconds,
    Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000)),
  );
  const quizSnapshot = {
    quiz_id: state.quiz.quiz_id,
    mode: state.quiz.mode,
    difficulty: state.quiz.difficulty,
    questions: safeQuestions(state.quiz.questions),
  };
  const documentName = state.document?.filename || "Untitled document";
  const answers = Object.entries(state.answers).map(([question_id, option_id]) => ({ question_id, option_id }));

  try {
    const result = await requestJson("/api/submit-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_id: state.quiz.quiz_id,
        answers,
        time_taken_seconds: timeTaken,
      }),
    });
    if (!Number.isFinite(Number(result?.total_questions)) || !Number.isFinite(Number(result?.score))) {
      throw new Error("The server returned an invalid result. Your quiz state has been retained; contact support before resubmitting.");
    }
    state.lastResult = {
      ...result,
      document_name: documentName,
      mode: quizSnapshot.mode,
      quiz: quizSnapshot,
    };
    writeStorage(LAST_RESULT_KEY, state.lastResult);
    clearActiveSession();
    state.lastResult = readStorage(LAST_RESULT_KEY);
    setSystemStatus(true);
    window.location.hash = "#results";
  } catch (error) {
    state.isSubmitting = false;
    showToast(`Submission failed: ${error.message}`, "error", 8000);
    renderQuiz();
    if (isTimeout) {
      const timeoutMessage = document.createElement("div");
      timeoutMessage.className = "form-error timeout-error";
      timeoutMessage.setAttribute("role", "alert");
      timeoutMessage.textContent = `Time expired, but submission failed: ${error.message}. Retry submission to send your saved answers.`;
      app.prepend(timeoutMessage);
    }
  }
}

function resultsTemplate(result) {
  const total = Number(result.total_questions) || 0;
  const score = Number(result.score) || 0;
  const accuracy = Number(result.accuracy) || 0;
  const accuracyPercent = Math.round(Math.max(0, Math.min(100, accuracy)));
  const review = Array.isArray(result.review) ? result.review : [];
  const questions = result.quiz?.questions || [];
  const reviewRows = review.length
    ? review.map((item, index) => {
        const question = questions.find((entry) => entry.id === String(item.question_id)) || questions[index];
        const options = question?.options || [];
        const selected = options.find((option) => option.id === String(item.selected_option_id));
        const correct = options.find((option) => option.id === String(item.correct_option_id));
        return `
          <article class="review-item ${item.is_correct ? "review-correct" : "review-incorrect"}">
            <div class="review-item-heading">
              <span class="review-mark material-symbols-outlined" aria-hidden="true">${item.is_correct ? "check_circle" : "cancel"}</span>
              <strong>Question ${index + 1}</strong>
              <span class="status-badge ${item.is_correct ? "accuracy-good" : "accuracy-low"}">${item.is_correct ? "Correct" : "Review"}</span>
            </div>
            <h3>${escapeHtml(question?.question || "Question text unavailable")}</h3>
            <p><strong>Your answer:</strong> ${escapeHtml(selected?.text || (item.selected_option_id ? `Option ${item.selected_option_id}` : "Unanswered"))}</p>
            ${!item.is_correct ? `<p><strong>Correct answer:</strong> ${escapeHtml(correct?.text || item.correct_option_id || "Not provided")}</p>` : ""}
            ${item.explanation ? `<p class="review-explanation">${escapeHtml(item.explanation)}</p>` : ""}
          </article>
        `;
      }).join("")
    : `<div class="empty-review"><p>Score summary is available, but this API response did not include question-by-question review.</p></div>`;

  return `
    <section class="page-section results-page" aria-labelledby="results-title">
      <header class="page-banner results-banner">
        <div class="page-banner-icon"><span class="material-symbols-outlined" aria-hidden="true">emoji_events</span></div>
        <div><span class="eyebrow">ASSESSMENT COMPLETE</span><h1 id="results-title">Your results</h1><p>${escapeHtml(result.document_name || "Quiz")} · Attempt #${escapeHtml(result.attempt_id ?? "—")}</p></div>
      </header>
      <div class="result-summary">
        <article class="result-score-card">
          <span class="stat-label">Score</span>
          <strong>${escapeHtml(score)}<small> / ${escapeHtml(total)}</small></strong>
          <span class="result-caption">${escapeHtml(formatAccuracy(accuracy))} accuracy</span>
          <div class="result-progress-track" role="progressbar" aria-label="Quiz accuracy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${accuracyPercent}">
            <span style="width: ${accuracyPercent}%"></span>
          </div>
        </article>
        <article class="result-metric"><span class="stat-label">Correct</span><strong>${escapeHtml(result.correct ?? "—")}</strong></article>
        <article class="result-metric"><span class="stat-label">Incorrect</span><strong>${escapeHtml(result.incorrect ?? "—")}</strong></article>
        <article class="result-metric"><span class="stat-label">Unanswered</span><strong>${escapeHtml(result.unanswered ?? "—")}</strong></article>
        <article class="result-metric"><span class="stat-label">Time taken</span><strong>${formatDuration(result.time_taken_seconds)}</strong></article>
      </div>
      <section class="panel review-panel" aria-labelledby="review-title">
        <div class="section-heading"><h2 id="review-title">Answer review</h2><span class="helper-label">${escapeHtml((result.mode || "exam").toUpperCase())} MODE</span></div>
        <div class="review-list">${reviewRows}</div>
      </section>
      <div class="results-actions">
        <a class="button button-neutral" href="#dashboard">Dashboard</a>
        <a class="button button-secondary" href="#history">View history</a>
        <a class="button button-primary" href="#upload">Create another quiz</a>
      </div>
    </section>
  `;
}

function renderResults() {
  state.lastResult = state.lastResult || readStorage(LAST_RESULT_KEY);
  if (!state.lastResult) {
    app.innerHTML = `
      <section class="empty-state page-empty">
        <span class="material-symbols-outlined" aria-hidden="true">assignment</span>
        <h1>No results to show</h1>
        <p>Complete and submit a quiz to view your score and answer review.</p>
        <a class="primary-action" href="#dashboard">Return to dashboard</a>
      </section>
    `;
    return;
  }
  app.innerHTML = resultsTemplate(state.lastResult);
}

function historyItemsTemplate(items) {
  if (!items.length) {
    return `<div class="empty-state"><span class="material-symbols-outlined" aria-hidden="true">history</span><h3>No attempts found</h3><p>Completed quizzes will appear here. Generate and submit a quiz to add your first attempt.</p><a class="primary-action" href="#upload">Upload a PDF</a></div>`;
  }
  return `
    <div class="history-table-wrap">
      <table class="history-table">
        <thead><tr><th scope="col">Document</th><th scope="col">Score</th><th scope="col">Accuracy</th><th scope="col">Attempted</th></tr></thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td data-label="Document"><strong title="${escapeHtml(item.document_name || "")}">${escapeHtml(item.document_name || "Untitled document")}</strong><small>Attempt #${escapeHtml(item.attempt_id ?? "—")}</small></td>
              <td data-label="Score">${escapeHtml(item.score ?? 0)} / ${escapeHtml(item.total_questions ?? 0)}</td>
              <td data-label="Accuracy"><span class="status-badge ${accuracyClass(item.accuracy)}">${escapeHtml(formatAccuracy(item.accuracy))}</span></td>
              <td data-label="Attempted">${escapeHtml(formatAttemptDate(item.attempted_at))}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function filteredHistory() {
  const normalizedFilter = state.historyFilter.toLowerCase();
  const items = state.historyItems.filter((item) => !normalizedFilter || String(item.document_name || "").toLowerCase().includes(normalizedFilter));
  if (state.historySort === "accuracy") items.sort((a, b) => Number(b.accuracy || 0) - Number(a.accuracy || 0));
  if (state.historySort === "recent") items.sort((a, b) => new Date(b.attempted_at || 0) - new Date(a.attempted_at || 0));
  return items;
}

function renderHistoryContent() {
  const items = filteredHistory();
  const totalPages = Math.max(1, Math.ceil(items.length / HISTORY_PAGE_SIZE));
  state.historyPage = Math.min(state.historyPage, totalPages);
  const start = (state.historyPage - 1) * HISTORY_PAGE_SIZE;
  const pageItems = items.slice(start, start + HISTORY_PAGE_SIZE);
  const rangeStart = items.length ? start + 1 : 0;
  const rangeEnd = Math.min(start + HISTORY_PAGE_SIZE, items.length);
  const container = document.getElementById("history-results");
  if (!container) return;
  container.innerHTML = `
    ${historyItemsTemplate(pageItems)}
    ${items.length ? `
      <div class="pagination">
        <span>Showing ${rangeStart}-${rangeEnd} of ${items.length}</span>
        <div>
          <button type="button" class="button button-neutral button-small" id="history-prev" ${state.historyPage <= 1 ? "disabled" : ""}>Previous</button>
          <span class="page-indicator">Page ${state.historyPage} of ${totalPages}</span>
          <button type="button" class="button button-neutral button-small" id="history-next" ${state.historyPage >= totalPages ? "disabled" : ""}>Next</button>
        </div>
      </div>
    ` : ""}
  `;
  document.getElementById("history-prev")?.addEventListener("click", () => {
    state.historyPage -= 1;
    renderHistoryContent();
  });
  document.getElementById("history-next")?.addEventListener("click", () => {
    state.historyPage += 1;
    renderHistoryContent();
  });
}

async function renderHistory() {
  app.innerHTML = `
    <section class="page-section">
      <header class="page-banner"><div class="page-banner-icon"><span class="material-symbols-outlined" aria-hidden="true">history</span></div><div><span class="eyebrow">YOUR PROGRESS</span><h1>Quiz history</h1><p>Results saved by the Grimoire backend.</p></div></header>
      <section class="panel history-panel">
        <div class="history-toolbar">
          <label class="search-control"><span class="material-symbols-outlined" aria-hidden="true">search</span><span class="visually-hidden">Filter by document name</span><input id="history-filter" type="search" placeholder="Filter by document…" value="${escapeHtml(state.historyFilter)}"></label>
          <label class="sort-control"><span class="visually-hidden">Sort history</span><select id="history-sort" class="select-control"><option value="recent" ${state.historySort === "recent" ? "selected" : ""}>Most recent</option><option value="accuracy" ${state.historySort === "accuracy" ? "selected" : ""}>Highest accuracy</option></select></label>
        </div>
        <div id="history-results">${loadingTemplate("Loading history")}</div>
      </section>
    </section>
  `;

  document.getElementById("history-filter").addEventListener("input", (event) => {
    state.historyFilter = event.target.value;
    state.historyPage = 1;
    renderHistoryContent();
  });
  document.getElementById("history-sort").addEventListener("change", (event) => {
    state.historySort = event.target.value;
    state.historyPage = 1;
    renderHistoryContent();
  });

  try {
    const payload = await requestJson(`/api/history?limit=${HISTORY_LIMIT}`);
    state.historyItems = Array.isArray(payload?.items) ? payload.items : [];
    setSystemStatus(true);
    renderHistoryContent();
  } catch (error) {
    const container = document.getElementById("history-results");
    container.innerHTML = `
      <div class="error-inline" role="alert">
        <span class="material-symbols-outlined" aria-hidden="true">cloud_off</span>
        <div><strong>History could not be loaded</strong><p>${escapeHtml(error.message)}</p></div>
        <button type="button" class="button button-neutral button-small" id="history-retry">Retry</button>
      </div>
    `;
    document.getElementById("history-retry").addEventListener("click", renderHistory);
    setSystemStatus(false);
  }
}

function bindUploadView() {
  const input = document.getElementById("file-input");
  const dropZone = document.getElementById("drop-zone");
  input.addEventListener("change", () => {
    if (input.files?.[0]) setSelectedFile(input.files[0]);
  });
  dropZone.addEventListener("click", (event) => {
    if (event.target !== input) input.click();
  });
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });
  ["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  }));
  ["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
  }));
  dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) setSelectedFile(file);
  });
  document.getElementById("remove-file").addEventListener("click", () => {
    state.selectedFile = null;
    renderUpload();
  });
  document.getElementById("upload-button").addEventListener("click", handleUpload);
  document.getElementById("quiz-config-form").addEventListener("submit", handleGenerate);
  document.querySelectorAll("[data-count]").forEach((button) => button.addEventListener("click", () => setSegmentSelection(button, "[data-count]")));
  document.querySelectorAll("[data-difficulty]").forEach((button) => button.addEventListener("click", () => setSegmentSelection(button, "[data-difficulty]")));
  document.querySelectorAll(".mode-card").forEach((card) => {
    card.querySelector("input").addEventListener("change", () => {
      document.querySelectorAll(".mode-card").forEach((item) => item.classList.toggle("selected", item.querySelector("input").checked));
    });
  });
}

function renderUpload() {
  app.innerHTML = uploadTemplate();
  bindUploadView();
}

function bindQuizView() {
  app.querySelectorAll("[data-question-index]").forEach((button) => {
    button.addEventListener("click", () => goToQuestion(Number(button.dataset.questionIndex)));
  });
  app.querySelectorAll('input[name="answer"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const questionId = state.quiz.questions[state.currentQuestion].id;
      setAnswer(questionId, radio.value);
    });
  });
  document.getElementById("previous-question")?.addEventListener("click", () => goToQuestion(state.currentQuestion - 1));
  document.getElementById("next-question")?.addEventListener("click", () => goToQuestion(state.currentQuestion + 1));
  document.getElementById("flag-question")?.addEventListener("click", () => {
    const id = state.quiz.questions[state.currentQuestion].id;
    state.flags = state.flags.includes(id) ? state.flags.filter((flag) => flag !== id) : [...state.flags, id];
    persistActiveSession();
    renderQuiz();
  });
  document.getElementById("submit-quiz")?.addEventListener("click", () => submitQuiz(false));
  document.getElementById("navigator-submit")?.addEventListener("click", () => submitQuiz(false));
}

function renderQuiz() {
  if (!state.quiz || !Array.isArray(state.quiz.questions) || !state.quiz.questions.length) {
    app.innerHTML = `
      <section class="empty-state page-empty">
        <span class="material-symbols-outlined" aria-hidden="true">quiz</span>
        <h1>No active quiz</h1>
        <p>Upload a PDF and generate a quiz before opening this page.</p>
        <a class="primary-action" href="#upload">Go to PDF upload</a>
      </section>
    `;
    return;
  }
  if (state.currentQuestion >= state.quiz.questions.length) state.currentQuestion = state.quiz.questions.length - 1;
  app.innerHTML = quizTemplate();
  bindQuizView();
  if (!state.timerId) startQuizTimer();
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

function setActiveRoute(route) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    const active = link.dataset.route === route;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function resolveRoute() {
  const requestedRoute = window.location.hash.replace("#", "").split("/")[0].toLowerCase();
  const route = ["dashboard", "upload", "quiz", "results", "history"].includes(requestedRoute) ? requestedRoute : "dashboard";
  setActiveRoute(route);
  closeSidebar();
  const titles = { dashboard: "Dashboard", upload: "Upload PDF", quiz: "Active Quiz", results: "Results", history: "Quiz History" };
  document.title = `Grimoire - ${titles[route]}`;

  if (route === "dashboard") renderDashboard();
  else if (route === "upload") renderUpload();
  else if (route === "quiz") renderQuiz();
  else if (route === "results") renderResults();
  else renderHistory();
}

menuButton.addEventListener("click", () => {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
});
sidebarClose.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);
window.addEventListener("hashchange", resolveRoute);
window.addEventListener("beforeunload", (event) => {
  if (!state.quiz || state.isSubmitting) return;
  event.preventDefault();
  event.returnValue = "";
});

restoreSession();
checkSystemStatus();
resolveRoute();
