const state = {
  currentWriter: "pen",
  currentInbox: "moon",
  letters: [],
  cloudReady: false,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const introScreen = $('[data-screen="intro"]');
const roomScreen = $('[data-screen="room"]');
const composer = $("[data-composer]");
const titleInput = $("[data-title]");
const bodyInput = $("[data-body]");
const letterList = $("[data-letter-list]");
const template = $("#letter-template");

const walletNames = {
  moon: "Moon Girl",
  pen: "Pen Boy",
};

const receiverFor = (writer) => (writer === "pen" ? "moon" : "pen");

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

async function setupCloud() {
  try {
    const response = await fetch("/api/letters");
    if (!response.ok) {
      throw new Error("Cloud endpoint is not ready");
    }

    state.letters = await response.json();
    state.cloudReady = true;
    saveLocalLetters();
    render();
    setCloudStatus("GitHub synced", "cloud");
  } catch (error) {
    console.info(error.message);
    setCloudStatus("Local preview", "local");
  }
}

function setCloudStatus(label, mode) {
  const status = $("[data-cloud-status]");
  status.querySelector("span:last-child").textContent = label;
  status.dataset.mode = mode;
}

function loadLocalLetters() {
  const saved = localStorage.getItem("moon-pen-letters");
  state.letters = saved ? JSON.parse(saved) : [];
}

function saveLocalLetters() {
  localStorage.setItem("moon-pen-letters", JSON.stringify(state.letters));
}

function updateComposerRoute() {
  const receiver = receiverFor(state.currentWriter);
  $("[data-compose-route]").textContent = `${walletNames[state.currentWriter]} to ${walletNames[receiver]}`;
}

function renderCounts() {
  ["moon", "pen"].forEach((wallet) => {
    const count = state.letters.filter((letter) => letter.to === wallet).length;
    $(`[data-count="${wallet}"]`).textContent = count;
  });
}

function renderInbox() {
  $("[data-inbox-title]").textContent = `${walletNames[state.currentInbox]} wallet`;
  $$("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.currentInbox);
  });

  const letters = state.letters.filter((letter) => letter.to === state.currentInbox);
  letterList.innerHTML = "";

  if (!letters.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No letters here yet. Send one with love.";
    letterList.append(empty);
    return;
  }

  letters.forEach((letter) => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector(".letter-meta").textContent = `From ${walletNames[letter.from]} - ${formatDate(letter.createdAt)}`;
    card.querySelector("h3").textContent = letter.title;
    card.querySelector(".letter-body").textContent = letter.body;
    letterList.append(card);
  });
}

function render() {
  renderCounts();
  renderInbox();
  updateComposerRoute();
}

async function sendLetter(event) {
  event.preventDefault();

  const letter = {
    title: titleInput.value.trim(),
    body: bodyInput.value.trim(),
    from: state.currentWriter,
    to: receiverFor(state.currentWriter),
    createdAt: new Date().toISOString(),
  };

  if (!letter.title || !letter.body) return;

  if (state.cloudReady) {
    try {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(letter),
      });

      if (!response.ok) {
        throw new Error("Could not save to GitHub");
      }

      state.letters = await response.json();
      saveLocalLetters();
    } catch (error) {
      console.info(error.message);
      setCloudStatus("Local preview", "local");
      state.cloudReady = false;
      state.letters = [letter, ...state.letters];
      saveLocalLetters();
    }
  } else {
    state.letters = [letter, ...state.letters];
    saveLocalLetters();
  }

  state.currentInbox = letter.to;
  composer.reset();
  render();
}

$("[data-open-envelope]").addEventListener("click", () => {
  introScreen.classList.add("pop-open");
  window.setTimeout(() => {
    introScreen.classList.add("hidden");
    roomScreen.classList.remove("hidden");
  }, 680);
});

$$("[data-compose]").forEach((button) => {
  button.addEventListener("click", () => {
    state.currentWriter = button.dataset.compose;
    composer.classList.remove("hidden");
    titleInput.focus();
    render();
  });
});

$$("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.currentInbox = button.dataset.filter;
    render();
  });
});

$("[data-close-composer]").addEventListener("click", () => {
  composer.classList.add("hidden");
});

composer.addEventListener("submit", sendLetter);

loadLocalLetters();
render();
setupCloud();
