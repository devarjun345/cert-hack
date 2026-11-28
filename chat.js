const STUDY_CHAT_FAQ = [
  {
    keywords: ["basic unit of life", "what is a cell", "cell"],
    answer: "A cell is the basic structural and functional unit of living things.",
  },
  {
    keywords: ["cell membrane", "membrane"],
    answer: "The cell membrane surrounds the cell and controls what enters and leaves it.",
  },
  {
    keywords: ["nucleus", "dna in a cell"],
    answer: "The nucleus stores most of a eukaryotic cell's DNA and helps direct cell activities.",
  },
  {
    keywords: ["mitochondria", "mitochondrion"],
    answer: "Mitochondria help cells release usable energy from food, mainly in the form of ATP.",
  },
  {
    keywords: ["photosynthesis", "chloroplast"],
    answer: "Photosynthesis is how plants use light, water, and carbon dioxide to make glucose and oxygen. It takes place in chloroplasts.",
  },
  {
    keywords: ["what is programming", "programming"],
    answer: "Programming is writing instructions that tell a computer how to perform tasks.",
  },
  {
    keywords: ["what is react", "react library", "reactjs", "react"],
    answer: "React is a JavaScript library for building user interfaces from reusable components.",
  },
  {
    keywords: ["what is a variable", "variable"],
    answer: "A variable is a named place to store a value so a program can use or update it.",
  },
  {
    keywords: ["what is a function", "function"],
    answer: "A function is a reusable block of code that can perform a task, often using inputs and returning a result.",
  },
  {
    keywords: ["what is a loop", "loop"],
    answer: "A loop repeats a block of code while a condition is true or for each item in a collection.",
  },
];

const chatLauncher = document.getElementById("study-chat-launcher");
const chatPanel = document.getElementById("study-chat-panel");
const chatClose = document.getElementById("study-chat-close");
const chatForm = document.getElementById("study-chat-form");
const chatInput = document.getElementById("study-chat-input");
const chatMessages = document.getElementById("study-chat-messages");
const chatSuggestions = document.getElementById("study-chat-suggestions");

function normalizeStudyQuestion(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function answerStudyQuestion(question) {
  const normalized = normalizeStudyQuestion(question);
  const match = STUDY_CHAT_FAQ
    .map((item) => {
      const score = Math.max(0, ...item.keywords
        .map(normalizeStudyQuestion)
        .filter((keyword) => ` ${normalized} `.includes(` ${keyword} `))
        .map((keyword) => keyword.length));
      return { item, score };
    })
    .sort((first, second) => second.score - first.score)[0];
  return match?.score
    ? match.item.answer
    : "I can help with cell biology and beginner programming. Try asking about photosynthesis, mitochondria, variables, functions, loops, or React.";
}

function appendStudyChatMessage(role, text) {
  const message = document.createElement("p");
  message.className = `study-chat-message ${role}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setStudyChatOpen(open) {
  chatPanel.hidden = !open;
  chatLauncher.setAttribute("aria-expanded", String(open));
  if (open) chatInput.focus();
  else chatLauncher.focus();
}

chatLauncher.addEventListener("click", () => setStudyChatOpen(chatPanel.hidden));
chatClose.addEventListener("click", () => setStudyChatOpen(false));

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatSuggestions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chat-prompt]");
  if (!button) return;
  chatInput.value = button.dataset.chatPrompt;
  chatForm.requestSubmit();
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;

  chatSuggestions.remove();
  appendStudyChatMessage("user", question);
  appendStudyChatMessage("assistant", answerStudyQuestion(question));
  chatInput.value = "";
  chatInput.focus();
});
