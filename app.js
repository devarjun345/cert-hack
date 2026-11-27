const API_BASE_URL = "http://127.0.0.1:8000";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const HISTORY_LIMIT = 100;
const HISTORY_PAGE_SIZE = 10;
const QUESTION_TIME_LIMIT = 60;
const ACTIVE_SESSION_KEY = "grimoire.active-session.v1";
const LAST_RESULT_KEY = "grimoire.last-result.v1";
const DEMO_STORE_KEY = "grimoire.demo-data.v1";
const FORCE_DEMO_MODE = new URLSearchParams(window.location.search).get("demo") === "1";

const DEMO_SOURCE_TEXT = "Cells are the basic units of life. The cell membrane regulates what enters and leaves a cell. In eukaryotic cells, the nucleus stores DNA, mitochondria produce most usable cellular energy, and chloroplasts carry out photosynthesis in plants. Ribosomes build proteins. During photosynthesis, plants use light energy, water, and carbon dioxide to produce glucose and oxygen.";

const DEMO_SEED = {
  documents: [
    { document_id: "demo-biology", filename: "Biology - Cell Structure.pdf", page_count: 18, extraction_status: "sample", text_preview: DEMO_SOURCE_TEXT, uploaded_at: "2026-11-27T09:10:00" },
    { document_id: "demo-history", filename: "World History - Ancient Civilizations.pdf", page_count: 32, extraction_status: "sample", text_preview: "Ancient civilizations developed around reliable sources of water. Agriculture supported permanent settlements, specialized work, trade, and systems of writing and government.", uploaded_at: "2026-11-26T14:30:00" },
    { document_id: "demo-chemistry", filename: "Chemistry - Atomic Basics.pdf", page_count: 12, extraction_status: "sample", text_preview: "Atoms contain protons and neutrons in a nucleus, with electrons occupying regions around it. The number of protons determines an element's atomic number.", uploaded_at: "2026-11-25T11:00:00" },
  ],
  attempts: [
    { attempt_id: 1042, document_name: "Biology - Cell Structure.pdf", score: 9, total_questions: 10, accuracy: 90, attempted_at: "2026-11-27T09:45:00" },
    { attempt_id: 1038, document_name: "World History - Ancient Civilizations.pdf", score: 8, total_questions: 10, accuracy: 80, attempted_at: "2026-11-26T15:05:00" },
    { attempt_id: 1034, document_name: "Chemistry - Atomic Basics.pdf", score: 7, total_questions: 10, accuracy: 70, attempted_at: "2026-11-25T11:42:00" },
    { attempt_id: 1029, document_name: "Biology - Cell Structure.pdf", score: 4, total_questions: 5, accuracy: 80, attempted_at: "2026-11-23T10:20:00" },
  ],
};

const DEMO_QUESTION_BANK = [
  { question: "What is the basic structural and functional unit of life?", options: [{ id: "A", text: "Cell" }, { id: "B", text: "Atom" }, { id: "C", text: "Organ" }, { id: "D", text: "Tissue" }], correct_option_id: "A", explanation: "Cells are the basic units of life." },
  { question: "Which structure regulates what enters and leaves a cell?", options: [{ id: "A", text: "Nucleus" }, { id: "B", text: "Cell membrane" }, { id: "C", text: "Ribosome" }, { id: "D", text: "Mitochondrion" }], correct_option_id: "B", explanation: "The cell membrane controls movement into and out of the cell." },
  { question: "Where is DNA stored in a typical eukaryotic cell?", options: [{ id: "A", text: "Cell membrane" }, { id: "B", text: "Ribosome" }, { id: "C", text: "Nucleus" }, { id: "D", text: "Cytoplasm only" }], correct_option_id: "C", explanation: "The nucleus stores the cell's DNA." },
  { question: "Which organelle produces most usable cellular energy?", options: [{ id: "A", text: "Mitochondrion" }, { id: "B", text: "Golgi apparatus" }, { id: "C", text: "Vacuole" }, { id: "D", text: "Cell wall" }], correct_option_id: "A", explanation: "Mitochondria produce most of a cell's usable energy." },
  { question: "Which organelle carries out photosynthesis in plant cells?", options: [{ id: "A", text: "Ribosome" }, { id: "B", text: "Chloroplast" }, { id: "C", text: "Nucleus" }, { id: "D", text: "Lysosome" }], correct_option_id: "B", explanation: "Photosynthesis takes place in chloroplasts." },
  { question: "What is the primary role of ribosomes?", options: [{ id: "A", text: "Store DNA" }, { id: "B", text: "Build proteins" }, { id: "C", text: "Control entry to the cell" }, { id: "D", text: "Capture sunlight" }], correct_option_id: "B", explanation: "Ribosomes assemble proteins." },
  { question: "Which inputs are used during photosynthesis?", options: [{ id: "A", text: "Oxygen and glucose" }, { id: "B", text: "Water and carbon dioxide" }, { id: "C", text: "Protein and nitrogen" }, { id: "D", text: "Salt and oxygen" }], correct_option_id: "B", explanation: "Plants use water and carbon dioxide along with light energy." },
  { question: "Which products are made by photosynthesis?", options: [{ id: "A", text: "Glucose and oxygen" }, { id: "B", text: "Water and nitrogen" }, { id: "C", text: "Carbon dioxide and protein" }, { id: "D", text: "DNA and water" }], correct_option_id: "A", explanation: "Photosynthesis produces glucose and oxygen." },
  { question: "Which cell structure contains the genetic material in eukaryotes?", options: [{ id: "A", text: "Nucleus" }, { id: "B", text: "Cell wall" }, { id: "C", text: "Ribosome" }, { id: "D", text: "Chloroplast only" }], correct_option_id: "A", explanation: "In eukaryotic cells, DNA is stored in the nucleus." },
  { question: "What kind of energy powers photosynthesis?", options: [{ id: "A", text: "Sound energy" }, { id: "B", text: "Light energy" }, { id: "C", text: "Mechanical energy" }, { id: "D", text: "Magnetic energy" }], correct_option_id: "B", explanation: "Photosynthesis uses light energy." },
];

const DEMO_CHEMISTRY_QUESTION_BANK = [
  { question: "Which subatomic particle has a positive charge?", options: [{ id: "A", text: "Proton" }, { id: "B", text: "Neutron" }, { id: "C", text: "Electron" }, { id: "D", text: "Photon" }], correct_option_id: "A", explanation: "Protons have a positive electric charge." },
  { question: "Which particle has no electric charge?", options: [{ id: "A", text: "Proton" }, { id: "B", text: "Neutron" }, { id: "C", text: "Electron" }, { id: "D", text: "Ion" }], correct_option_id: "B", explanation: "Neutrons are electrically neutral." },
  { question: "Which particle has a negative charge?", options: [{ id: "A", text: "Neutron" }, { id: "B", text: "Proton" }, { id: "C", text: "Electron" }, { id: "D", text: "Nucleus" }], correct_option_id: "C", explanation: "Electrons have a negative electric charge." },
  { question: "What determines an element's atomic number?", options: [{ id: "A", text: "Number of protons" }, { id: "B", text: "Number of neutrons" }, { id: "C", text: "Number of shells" }, { id: "D", text: "Total mass" }], correct_option_id: "A", explanation: "An element's atomic number is the number of protons in its nucleus." },
  { question: "Where are protons and neutrons found?", options: [{ id: "A", text: "In the nucleus" }, { id: "B", text: "Outside the atom" }, { id: "C", text: "In electron shells" }, { id: "D", text: "In chemical bonds only" }], correct_option_id: "A", explanation: "Protons and neutrons are located in the nucleus." },
];

const DEMO_HISTORY_QUESTION_BANK = [
  { question: "Where did many early civilizations develop?", options: [{ id: "A", text: "Near reliable water sources" }, { id: "B", text: "Only on mountain peaks" }, { id: "C", text: "Far from trade routes" }, { id: "D", text: "On uninhabited islands" }], correct_option_id: "A", explanation: "Reliable water supported agriculture and permanent settlements." },
  { question: "What helped support permanent settlements?", options: [{ id: "A", text: "Agriculture" }, { id: "B", text: "Seasonal migration only" }, { id: "C", text: "The absence of trade" }, { id: "D", text: "Nomadic hunting alone" }], correct_option_id: "A", explanation: "Agriculture provided a more reliable food supply." },
  { question: "What did specialized work allow people to do?", options: [{ id: "A", text: "Focus on different occupations" }, { id: "B", text: "Stop exchanging goods" }, { id: "C", text: "Avoid living in settlements" }, { id: "D", text: "Eliminate government" }], correct_option_id: "A", explanation: "Stable food supplies allowed people to develop different occupations." },
  { question: "Which development helped preserve records and information?", options: [{ id: "A", text: "Writing systems" }, { id: "B", text: "Barter alone" }, { id: "C", text: "Seasonal flooding" }, { id: "D", text: "Stone tools only" }], correct_option_id: "A", explanation: "Writing systems helped civilizations record information." },
  { question: "What does trade allow communities to do?", options: [{ id: "A", text: "Exchange goods" }, { id: "B", text: "Avoid all contact" }, { id: "C", text: "End specialization" }, { id: "D", text: "Stop producing food" }], correct_option_id: "A", explanation: "Trade connects communities through the exchange of goods." },
];

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
  questionTimeRemaining: {},
  currentQuestionStartedAt: null,
  timeoutReached: false,
  timerId: null,
  isSubmitting: false,
  historyItems: [],
  historyFilter: "",
  historySort: "recent",
  historyPage: 1,
  lastResult: null,
  apiOnline: false,
  demoMode: FORCE_DEMO_MODE,
  demoCorrectAnswers: {},
  demoData: null,
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

function setSystemStatus(online, demo = state.demoMode) {
  systemStatusName.textContent = demo ? "DEMO" : online ? "ONLINE" : "OFFLINE";
  systemStatusDot.className = `status-dot ${demo ? "demo" : online ? "online" : "offline"}`;
  systemStatusDot.setAttribute("aria-label", demo ? "Demo mode active" : online ? "API online" : "API offline");
}

async function checkSystemStatus() {
  try {
    await requestJson("/");
    state.apiOnline = true;
    state.demoMode = FORCE_DEMO_MODE || Boolean(state.quiz?.is_demo || state.document?.is_demo);
    setSystemStatus(true, state.demoMode);
    return true;
  } catch (error) {
    state.apiOnline = false;
    state.demoMode = FORCE_DEMO_MODE || Boolean(state.quiz?.is_demo) || isConnectionError(error);
    setSystemStatus(false, state.demoMode);
    return false;
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

function getCurrentQuestionRemaining(now = Date.now()) {
  const question = state.quiz?.questions?.[state.currentQuestion];
  if (!question) return QUESTION_TIME_LIMIT;
  const saved = Number(state.questionTimeRemaining[question.id]);
  const remaining = Number.isFinite(saved) ? saved : QUESTION_TIME_LIMIT;
  if (!state.currentQuestionStartedAt) return remaining;
  return Math.max(0, remaining - Math.floor((now - state.currentQuestionStartedAt) / 1000));
}

function syncCurrentQuestionTime(now = Date.now()) {
  const question = state.quiz?.questions?.[state.currentQuestion];
  if (!question) return QUESTION_TIME_LIMIT;
  if (!Number.isFinite(Number(state.questionTimeRemaining[question.id]))) {
    state.questionTimeRemaining[question.id] = QUESTION_TIME_LIMIT;
  }
  if (!state.currentQuestionStartedAt) state.currentQuestionStartedAt = now;
  const elapsed = Math.floor((now - state.currentQuestionStartedAt) / 1000);
  if (elapsed > 0) {
    state.questionTimeRemaining[question.id] = Math.max(
      0,
      Number(state.questionTimeRemaining[question.id]) - elapsed,
    );
    state.currentQuestionStartedAt += elapsed * 1000;
  }
  return Number(state.questionTimeRemaining[question.id]);
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

function isConnectionError(error) {
  return error?.message?.startsWith("Could not connect to the Grimoire API")
    || error?.message?.startsWith("The API request timed out");
}

function cloneDemoSeed() {
  return JSON.parse(JSON.stringify(DEMO_SEED));
}

function getDemoData() {
  if (state.demoData) return state.demoData;
  try {
    const stored = localStorage.getItem(DEMO_STORE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.documents) && Array.isArray(parsed.attempts)) {
        state.demoData = parsed;
        return state.demoData;
      }
      showToast("Saved demo data was invalid. Sample data has been restored.", "error");
    }
  } catch {
    showToast("Saved demo data could not be read. Sample data has been restored.", "error");
  }
  state.demoData = cloneDemoSeed();
  saveDemoData(state.demoData);
  return state.demoData;
}

function saveDemoData(data) {
  state.demoData = data;
  try {
    localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(data));
  } catch {
    showToast("Demo changes cannot be saved in this browser. They will be lost when this page closes.", "error");
  }
}

function activateDemoMode() {
  state.apiOnline = false;
  state.demoMode = true;
  setSystemStatus(false, true);
}

function demoNotice(message, includeReset = false) {
  return `
    <div class="demo-notice" role="status">
      <span class="material-symbols-outlined" aria-hidden="true">science</span>
      <div><strong>DEMO MODE</strong><span>${escapeHtml(message)}</span></div>
      <span class="demo-tag">SAMPLE DATA</span>
      ${includeReset ? '<button type="button" class="demo-reset-button" id="reset-demo-data">Reset sample data</button>' : ""}
    </div>
  `;
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
  if (state.quiz) syncCurrentQuestionTime();
  writeStorage(ACTIVE_SESSION_KEY, {
    document: state.document,
    quiz: state.quiz ? {
      quiz_id: state.quiz.quiz_id,
      document_id: state.quiz.document_id,
      mode: state.quiz.mode,
      difficulty: state.quiz.difficulty,
      questions: safeQuestions(state.quiz.questions),
      is_demo: Boolean(state.quiz.is_demo),
    } : null,
    answers: state.answers,
    flags: state.flags,
    currentQuestion: state.currentQuestion,
    durationSeconds: state.durationSeconds,
    startedAt: state.startedAt,
    deadline: state.deadline,
    timeoutReached: state.timeoutReached,
    questionTimeRemaining: state.questionTimeRemaining,
    currentQuestionStartedAt: state.currentQuestionStartedAt,
    demoCorrectAnswers: state.demoCorrectAnswers,
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
  state.questionTimeRemaining = saved.questionTimeRemaining && typeof saved.questionTimeRemaining === "object"
    ? saved.questionTimeRemaining
    : {};
  state.currentQuestionStartedAt = Number(saved.currentQuestionStartedAt) || null;
  state.demoCorrectAnswers = saved.demoCorrectAnswers && typeof saved.demoCorrectAnswers === "object"
    ? saved.demoCorrectAnswers
    : {};
  if (state.quiz?.is_demo || state.document?.is_demo) state.demoMode = true;
  if (state.quiz && Array.isArray(state.quiz.questions)) {
    state.quiz.questions.forEach((question) => {
      if (!Number.isFinite(Number(state.questionTimeRemaining[question.id]))) {
        state.questionTimeRemaining[question.id] = QUESTION_TIME_LIMIT;
      }
    });
    if (!state.currentQuestionStartedAt) state.currentQuestionStartedAt = Date.now();
  }
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
  state.questionTimeRemaining = {};
  state.currentQuestionStartedAt = null;
  state.timeoutReached = false;
  state.demoCorrectAnswers = {};
  state.isSubmitting = false;
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
  try {
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // Keep the app usable if browser storage is disabled.
  }
}

function uploadedDocumentsTemplate(documents, demoMode) {
  if (!documents.length) {
    return `<div class="documents-empty"><span class="material-symbols-outlined" aria-hidden="true">folder_open</span><span>No uploaded documents yet. Upload a PDF to get started.</span><a class="panel-action" href="#upload">Upload PDF</a></div>`;
  }
  return `
    <div class="document-list">
      ${documents.slice(0, 5).map((item) => `
        <article class="document-row">
          <span class="document-row-icon material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>
          <div class="document-row-info">
            <strong title="${escapeHtml(item.filename)}">${escapeHtml(item.filename)}</strong>
            <span>${escapeHtml(item.page_count)} pages · ${escapeHtml(formatAttemptDate(item.uploaded_at))}</span>
          </div>
          <span class="status-badge ${demoMode ? "badge-demo" : "accuracy-good"}">${demoMode ? "SAMPLE" : "READY"}</span>
          ${demoMode ? `<button type="button" class="secondary-action" data-demo-doc-id="${escapeHtml(item.document_id)}">Start quiz</button>` : ""}
        </article>
      `).join("")}
    </div>
  `;
}

function dashboardTemplate(items, documents = [], demoMode = false) {
  const averageAccuracy = items.length
    ? items.reduce((sum, item) => sum + (Number(item.accuracy) || 0), 0) / items.length
    : 0;
  const uniqueDocuments = documents.length || new Set(items.map((item) => item.document_name).filter(Boolean)).size;
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
      ${demoMode ? demoNotice("This sample workspace runs in your browser. PDF extraction and quiz scoring are simulated; no file is sent to a server.", true) : ""}
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
      <section class="recent-panel documents-panel" aria-labelledby="documents-title">
        <header class="panel-header">
          <div><h2 id="documents-title">Recent documents</h2><p>${demoMode ? "Sample PDFs available to try" : "Uploaded PDFs available in this session"}</p></div>
          <a class="panel-action" href="#upload">Upload PDF</a>
        </header>
        ${uploadedDocumentsTemplate(documents, demoMode)}
      </section>
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
          <div><h2 id="recent-title">Recent attempts</h2><p>${demoMode ? "Sample and simulated attempts saved in this browser" : "Most recent completed results returned by the API"}</p></div>
          <a class="panel-action" href="#history">View history</a>
        </header>
        <div class="attempt-list">${rows}</div>
      </section>
    </section>
  `;
}

function bindDashboardView(documents, demoMode) {
  if (!demoMode) return;
  document.getElementById("reset-demo-data")?.addEventListener("click", () => {
    if (state.quiz?.is_demo && !window.confirm("Reset sample data and discard the active demo quiz?")) return;
    if (state.quiz?.is_demo || state.document?.is_demo) clearActiveSession();
    if (state.lastResult?.demo_mode) {
      state.lastResult = null;
      try {
        sessionStorage.removeItem(LAST_RESULT_KEY);
      } catch {
        showToast("The previous demo result could not be cleared from session storage.", "error");
      }
    }
    saveDemoData(cloneDemoSeed());
    showToast("Sample documents and attempts were restored.", "success");
    renderDashboard();
  });
  app.querySelectorAll("[data-demo-doc-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = documents.find((item) => item.document_id === button.dataset.demoDocId);
      if (!selected) {
        showToast("That sample document is no longer available.", "error");
        return;
      }
      if (state.quiz && !window.confirm("Starting another quiz will leave your current quiz. Continue?")) return;
      clearActiveSession();
      activateDemoMode();
      state.document = { ...selected, is_demo: true };
      state.selectedFile = null;
      persistActiveSession();
      window.location.hash = "#upload";
    });
  });
}

async function renderDashboard() {
  app.innerHTML = loadingTemplate("Loading dashboard");
  if (state.demoMode) {
    const data = getDemoData();
    state.historyItems = data.attempts.slice().sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at));
    app.innerHTML = dashboardTemplate(state.historyItems, data.documents, true);
    bindDashboardView(data.documents, true);
    return;
  }
  try {
    const payload = await requestJson(`/api/history?limit=${HISTORY_LIMIT}`);
    const items = Array.isArray(payload?.items) ? payload.items : [];
    state.apiOnline = true;
    setSystemStatus(true, false);
    app.innerHTML = dashboardTemplate(items, state.document ? [state.document] : [], false);
  } catch (error) {
    if (isConnectionError(error)) {
      activateDemoMode();
      const data = getDemoData();
      state.historyItems = data.attempts.slice().sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at));
      app.innerHTML = dashboardTemplate(state.historyItems, data.documents, true);
      bindDashboardView(data.documents, true);
      return;
    }
    state.apiOnline = false;
    setSystemStatus(false, false);
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
      ${state.demoMode ? demoNotice("Choose a PDF to simulate an upload. The browser will use clearly labeled sample text instead of sending or parsing the file.") : ""}
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
            <span class="helper-label">${state.demoMode ? "Demo mode: file remains in this browser; sample content is used." : "Text-based PDFs only. Uploads are validated by the server."}</span>
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
              <div><strong>${escapeHtml(activeDocument.filename)}</strong><span>${escapeHtml(activeDocument.page_count)} pages · ${activeDocument.is_demo ? "Sample content · ready to configure" : "Ready to configure"}</span></div>
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

async function simulateDemoUpload(file, progressCallback) {
  progressCallback(20);
  await new Promise((resolve) => window.setTimeout(resolve, 200));
  progressCallback(70);
  await new Promise((resolve) => window.setTimeout(resolve, 250));
  progressCallback(100);
  return {
    document_id: `demo-upload-${Date.now()}`,
    filename: file.name,
    page_count: 8,
    extraction_status: "DEMO SAMPLE · NOT EXTRACTED",
    text_preview: DEMO_SOURCE_TEXT,
    uploaded_at: new Date().toISOString(),
    is_demo: true,
  };
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
    const progressCallback = (percentage) => {
      progressBar.style.width = `${percentage}%`;
      progressValue.textContent = `${percentage}%`;
      if (percentage >= 100) status.textContent = state.demoMode ? "Preparing sample preview…" : "Extracting document text…";
    };
    const result = state.demoMode
      ? await simulateDemoUpload(file, progressCallback)
      : await uploadPdf(file, progressCallback);
    state.document = {
      document_id: result.document_id,
      filename: result.filename || file.name,
      page_count: result.page_count ?? 0,
      extraction_status: result.extraction_status || "success",
      text_preview: result.text_preview || "",
      uploaded_at: result.uploaded_at || new Date().toISOString(),
      is_demo: Boolean(result.is_demo),
    };
    if (state.document.is_demo) {
      const demoData = getDemoData();
      demoData.documents = [state.document, ...demoData.documents.filter((item) => item.document_id !== state.document.document_id)];
      saveDemoData(demoData);
    }
    state.selectedFile = null;
    persistActiveSession();
    showToast(state.document.is_demo
      ? "Demo upload ready. No PDF was sent or parsed; sample text is being used."
      : "PDF uploaded and extracted successfully.", "success");
    renderUpload();
  } catch (error) {
    if (isConnectionError(error)) {
      activateDemoMode();
      renderUpload();
      showToast("Backend is unavailable. Demo mode is active; upload again to use sample content.", "info", 7000);
      return;
    }
    displayFormError("upload-error", error.message);
    button.disabled = false;
    button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">cloud_upload</span> Try upload again';
    status.textContent = "Upload failed";
    progressBar.classList.add("progress-bar-error");
    state.apiOnline = false;
    setSystemStatus(false, false);
  }
}

function setSegmentSelection(button, selector) {
  document.querySelectorAll(selector).forEach((item) => {
    const selected = item === button;
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
}

function createDemoQuiz(count, difficulty, mode) {
  const documentId = state.document.document_id || "";
  const filename = (state.document.filename || "").toLowerCase();
  const bank = documentId.includes("chemistry") || filename.includes("chemistry")
    ? DEMO_CHEMISTRY_QUESTION_BANK
    : documentId.includes("history") || filename.includes("history")
      ? DEMO_HISTORY_QUESTION_BANK
      : DEMO_QUESTION_BANK;
  const selectedQuestions = bank.slice(0, Math.min(count, bank.length));
  if (selectedQuestions.length < count) {
    showToast(`The demo question bank has ${selectedQuestions.length} questions, so the quiz will use that many.`, "info", 6000);
  }
  const questions = selectedQuestions.map((question, index) => ({
    ...question,
    id: `demo-question-${Date.now()}-${index + 1}`,
  }));
  const demoCorrectAnswers = Object.fromEntries(questions.map((question) => [
    question.id,
    { option_id: question.correct_option_id, explanation: question.explanation },
  ]));
  return {
    quiz_id: `demo-quiz-${Date.now()}`,
    document_id: state.document.document_id,
    mode,
    difficulty,
    is_demo: true,
    questions,
    demoCorrectAnswers,
  };
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
    const result = state.demoMode
      ? createDemoQuiz(count, difficulty, mode)
      : await requestJson("/api/generate-quiz", {
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
      is_demo: Boolean(result.is_demo),
    };
    state.demoCorrectAnswers = result.demoCorrectAnswers || {};
    state.answers = {};
    state.flags = [];
    state.currentQuestion = 0;
    state.questionTimeRemaining = Object.fromEntries(questions.map((question) => [question.id, QUESTION_TIME_LIMIT]));
    state.durationSeconds = durationSeconds;
    state.startedAt = Date.now();
    state.deadline = state.startedAt + durationSeconds * 1000;
    state.currentQuestionStartedAt = state.startedAt;
    state.timeoutReached = false;
    state.isSubmitting = false;
    persistActiveSession();
    window.location.hash = "#quiz";
  } catch (error) {
    if (isConnectionError(error)) {
      activateDemoMode();
      displayFormError("generate-error", "Backend unavailable. Demo mode is now active; select Generate quiz again to create a clearly labeled sample quiz.");
      button.disabled = false;
      button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">bolt</span> Generate demo quiz';
      return;
    }
    displayFormError("generate-error", error.message);
    button.disabled = false;
    button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">bolt</span> Try generating again';
  }
}

function quizTemplate() {
  const quiz = state.quiz;
  const question = quiz.questions[state.currentQuestion];
  const total = quiz.questions.length;
  const questionRemaining = getCurrentQuestionRemaining();
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
    const expired = Number(state.questionTimeRemaining[item.id]) <= 0;
    return `
      <button type="button" class="question-number ${index === state.currentQuestion ? "current" : ""} ${answered ? "answered" : ""} ${expired ? "expired" : ""} ${state.flags.includes(item.id) ? "flagged" : ""}"
        data-question-index="${index}" ${expired ? "disabled" : ""} aria-label="Go to question ${index + 1}${answered ? ", answered" : ", unanswered"}${expired ? ", time expired" : ""}${state.flags.includes(item.id) ? ", flagged" : ""}"
        aria-current="${index === state.currentQuestion ? "step" : "false"}">
        ${index + 1}
      </button>
    `;
  }).join("");

  return `
    <section class="page-section quiz-page" aria-labelledby="quiz-title">
      <header class="quiz-status-bar">
        <div class="quiz-heading">
          ${quiz.is_demo ? '<span class="badge badge-demo">DEMO · BROWSER SCORED</span>' : ""}
          <span class="badge badge-primary">${escapeHtml((quiz.mode || "exam").toUpperCase())} MODE</span>
          <h1 id="quiz-title">${escapeHtml(state.document?.filename || "Active quiz")}</h1>
          <span class="helper-label">${total} QUESTIONS · ${escapeHtml(capitalize(quiz.difficulty || "medium"))} · 60 SEC / QUESTION</span>
        </div>
        <div class="timer-stack">
          <div class="timer-card question-timer-card" role="timer" aria-label="Time remaining for this question">
            <span class="material-symbols-outlined" aria-hidden="true">hourglass_top</span>
            <div><span class="timer-label">QUESTION TIME</span><strong id="question-countdown-timer">${formatDuration(questionRemaining)}</strong></div>
          </div>
          <div class="timer-card session-timer-card" role="timer" aria-label="Total quiz time remaining">
            <span class="material-symbols-outlined" aria-hidden="true">timer</span>
            <div><span class="timer-label">QUIZ TIME</span><strong id="countdown-timer">${formatDuration(Math.ceil(Math.max(0, state.deadline - Date.now()) / 1000))}</strong></div>
          </div>
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
  if (!state.currentQuestionStartedAt) state.currentQuestionStartedAt = Date.now();
  state.timerId = window.setInterval(() => {
    if (!state.quiz || state.isSubmitting) {
      window.clearInterval(state.timerId);
      state.timerId = null;
      return;
    }
    const now = Date.now();
    const totalRemaining = Math.max(0, Math.ceil((state.deadline - now) / 1000));
    const totalTimer = document.getElementById("countdown-timer");
    if (totalTimer) {
      totalTimer.textContent = formatDuration(totalRemaining);
      totalTimer.classList.toggle("timer-warning", totalRemaining <= 60);
    }
    if (totalRemaining <= 0 && !state.timeoutReached) {
      state.timeoutReached = true;
      persistActiveSession();
      window.clearInterval(state.timerId);
      state.timerId = null;
      submitQuiz(true);
      return;
    }

    const questionRemaining = syncCurrentQuestionTime(now);
    const questionTimer = document.getElementById("question-countdown-timer");
    if (questionTimer) {
      questionTimer.textContent = formatDuration(questionRemaining);
      questionTimer.classList.toggle("timer-warning", questionRemaining <= 10);
    }
    if (questionRemaining <= 0) {
      expireCurrentQuestion();
      return;
    }
    persistActiveSession();
  }, 1000);
}

function nextAvailableQuestionIndex() {
  if (!state.quiz) return -1;
  const total = state.quiz.questions.length;
  for (let offset = 1; offset < total; offset += 1) {
    const index = (state.currentQuestion + offset) % total;
    const questionId = state.quiz.questions[index].id;
    if (Number(state.questionTimeRemaining[questionId]) > 0) return index;
  }
  return -1;
}

function expireCurrentQuestion() {
  if (!state.quiz || state.isSubmitting) return;
  const currentQuestion = state.quiz.questions[state.currentQuestion];
  state.questionTimeRemaining[currentQuestion.id] = 0;
  const nextIndex = nextAvailableQuestionIndex();
  if (nextIndex < 0) {
    state.timeoutReached = true;
    persistActiveSession();
    if (state.timerId) window.clearInterval(state.timerId);
    state.timerId = null;
    submitQuiz(true);
    return;
  }
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
  state.currentQuestion = nextIndex;
  state.currentQuestionStartedAt = Date.now();
  persistActiveSession();
  showToast(`Time is up for question ${state.quiz.questions.findIndex((item) => item.id === currentQuestion.id) + 1}. Moving to the next question.`, "info", 3500);
  renderQuiz();
}

function goToQuestion(index) {
  if (!state.quiz) return;
  syncCurrentQuestionTime();
  const nextIndex = Math.max(0, Math.min(index, state.quiz.questions.length - 1));
  const nextQuestion = state.quiz.questions[nextIndex];
  if (Number(state.questionTimeRemaining[nextQuestion.id]) <= 0) {
    showToast("Time has expired for that question.", "error");
    return;
  }
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
  state.currentQuestion = nextIndex;
  state.currentQuestionStartedAt = Date.now();
  persistActiveSession();
  renderQuiz();
}

function evaluateDemoQuiz(questions, answers, timeTaken) {
  const selectedAnswers = Object.fromEntries(answers.map((answer) => [answer.question_id, answer.option_id]));
  const review = questions.map((question) => {
    const key = state.demoCorrectAnswers[question.id];
    if (!key?.option_id) throw new Error("The saved demo answer key is missing. Restart this sample quiz before submitting.");
    const selectedOptionId = selectedAnswers[question.id] || null;
    return {
      question_id: question.id,
      selected_option_id: selectedOptionId,
      correct_option_id: key.option_id,
      is_correct: selectedOptionId === key.option_id,
      explanation: key.explanation || "",
    };
  });
  const correct = review.filter((item) => item.is_correct).length;
  const answered = review.filter((item) => item.selected_option_id).length;
  const total = questions.length;
  const result = {
    attempt_id: Date.now(),
    score: correct,
    total_questions: total,
    accuracy: total ? (correct / total) * 100 : 0,
    correct,
    incorrect: answered - correct,
    unanswered: total - answered,
    time_taken_seconds: timeTaken,
    review,
  };
  const demoData = getDemoData();
  demoData.attempts.unshift({
    attempt_id: result.attempt_id,
    document_name: state.document?.filename || "Demo document",
    score: result.score,
    total_questions: result.total_questions,
    accuracy: result.accuracy,
    attempted_at: new Date().toISOString(),
  });
  saveDemoData(demoData);
  return result;
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
    is_demo: Boolean(state.quiz.is_demo),
  };
  const documentName = state.document?.filename || "Untitled document";
  const answers = Object.entries(state.answers).map(([question_id, option_id]) => ({ question_id, option_id }));

  try {
    const result = quizSnapshot.is_demo
      ? evaluateDemoQuiz(quizSnapshot.questions, answers, timeTaken)
      : await requestJson("/api/submit-quiz", {
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
      demo_mode: quizSnapshot.is_demo,
    };
    writeStorage(LAST_RESULT_KEY, state.lastResult);
    clearActiveSession();
    state.lastResult = readStorage(LAST_RESULT_KEY);
    setSystemStatus(state.apiOnline, state.demoMode);
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
        <div><span class="eyebrow">${result.demo_mode ? "DEMO RESULT · SCORED IN THIS BROWSER" : "ASSESSMENT COMPLETE"}</span><h1 id="results-title">Your results</h1><p>${escapeHtml(result.document_name || "Quiz")} · Attempt #${escapeHtml(result.attempt_id ?? "—")}</p></div>
      </header>
      ${result.demo_mode ? demoNotice("This score was calculated in your browser using sample questions. It is not a server-verified result.") : ""}
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
      ${state.demoMode ? demoNotice("Sample attempts and demo scores are stored only in this browser.") : ""}
      <header class="page-banner"><div class="page-banner-icon"><span class="material-symbols-outlined" aria-hidden="true">history</span></div><div><span class="eyebrow">YOUR PROGRESS</span><h1>Quiz history</h1><p>${state.demoMode ? "Local sample and simulated results." : "Results saved by the Grimoire backend."}</p></div></header>
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

  if (state.demoMode) {
    state.historyItems = getDemoData().attempts.slice();
    renderHistoryContent();
    return;
  }

  try {
    const payload = await requestJson(`/api/history?limit=${HISTORY_LIMIT}`);
    state.historyItems = Array.isArray(payload?.items) ? payload.items : [];
    state.apiOnline = true;
    setSystemStatus(true, false);
    renderHistoryContent();
  } catch (error) {
    if (isConnectionError(error)) {
      activateDemoMode();
      renderHistory();
      return;
    }
    const container = document.getElementById("history-results");
    container.innerHTML = `
      <div class="error-inline" role="alert">
        <span class="material-symbols-outlined" aria-hidden="true">cloud_off</span>
        <div><strong>History could not be loaded</strong><p>${escapeHtml(error.message)}</p></div>
        <button type="button" class="button button-neutral button-small" id="history-retry">Retry</button>
      </div>
    `;
    document.getElementById("history-retry").addEventListener("click", renderHistory);
    state.apiOnline = false;
    setSystemStatus(false, false);
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

async function initializeApp() {
  restoreSession();
  if (FORCE_DEMO_MODE) {
    if (state.quiz && !state.quiz.is_demo) clearActiveSession();
    activateDemoMode();
  } else {
    await checkSystemStatus();
  }
  resolveRoute();
}

initializeApp();
