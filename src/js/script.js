const githubUser = "luisalvacelis";
const repoGrid = document.getElementById("repositories");
const filterButtons = document.querySelectorAll(".filter-btn");

const totalReposEl = document.getElementById("total-repos");
const totalStarsEl = document.getElementById("total-stars");
const topLanguageEl = document.getElementById("top-language");
const activeYearEl = document.getElementById("active-year");

const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");
const themeToggle = document.getElementById("theme-toggle");
const scrollTopBtn = document.getElementById("scroll-top");
const htmlEl = document.documentElement;

let cachedRepos = [];

/* ===== THEME ===== */
function setTheme(theme) {
  htmlEl.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const current = htmlEl.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
});

const savedTheme = localStorage.getItem("theme") || "dark";
setTheme(savedTheme);

/* ===== SCROLL REVEAL (IntersectionObserver) ===== */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => {
  const parent = el.parentElement;
  const siblings = parent.querySelectorAll(":scope > .reveal");
  const idx = Array.from(siblings).indexOf(el);
  el.style.setProperty("--reveal-delay", `${idx * 0.12}s`);
  revealObserver.observe(el);
});

/* ===== ACTIVE NAV LINK ===== */
const navSections = document.querySelectorAll("section[id], footer[id]");
const navLinks = document.querySelectorAll(".main-nav a");

function updateActiveNav() {
  let current = "";
  const scrollY = window.scrollY;

  navSections.forEach((section) => {
    const top = section.offsetTop - 140;
    if (scrollY >= top) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${current}`
    );
  });
}

/* ===== SCROLL TO TOP ===== */
function updateScrollTop() {
  scrollTopBtn.classList.toggle("visible", window.scrollY > 500);
}

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

let scrollTicking = false;
window.addEventListener("scroll", () => {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      updateActiveNav();
      updateScrollTop();
      scrollTicking = false;
    });
    scrollTicking = true;
  }
});

/* ===== HELPERS ===== */
function formatDate(isoDate) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

function getTopLanguage(repos) {
  const languageCount = repos.reduce((acc, repo) => {
    if (!repo.language) return acc;
    acc[repo.language] = (acc[repo.language] || 0) + 1;
    return acc;
  }, {});

  return (
    Object.entries(languageCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixto"
  );
}

/* ===== ANIMATED COUNTER ===== */
function animateCount(el, target, duration) {
  if (isNaN(target)) {
    el.textContent = String(target);
    return;
  }

  duration = duration || 1400;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(target * eased));

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function paintStats(repos) {
  const totalStars = repos.reduce(
    (sum, repo) => sum + (repo.stargazers_count || 0),
    0
  );

  const lastUpdate = repos[0]?.updated_at;

  animateCount(totalReposEl, repos.length);
  animateCount(totalStarsEl, totalStars);
  topLanguageEl.textContent = getTopLanguage(repos);
  activeYearEl.textContent = lastUpdate
    ? String(new Date(lastUpdate).getFullYear())
    : "N/D";
}

/* ===== REPOS ===== */
function repoTemplate(repo) {
  const description = repo.description || "Proyecto en evolución con enfoque práctico.";
  const language = repo.language || "Sin lenguaje definido";

  return `
    <article class="repo-card">
      <h3>${repo.name}</h3>
      <div class="repo-meta">
        <span><i class="fa-solid fa-code"></i> ${language}</span>
        <span><i class="fa-solid fa-star"></i> ${repo.stargazers_count}</span>
        <span><i class="fa-solid fa-clock"></i> ${formatDate(repo.updated_at)}</span>
      </div>
      <p>${description}</p>
      <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
        Ver repositorio <i class="fa-solid fa-arrow-up-right-from-square"></i>
      </a>
    </article>
  `;
}

function renderRepos(filter) {
  filter = filter || "all";
  let reposToRender = [].concat(cachedRepos);

  if (filter === "recent") {
    reposToRender = reposToRender
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 9);
  }

  if (filter === "starred") {
    reposToRender = reposToRender
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 9);
  }

  if (!reposToRender.length) {
    repoGrid.innerHTML = '<p class="empty-state">No hay repositorios para este filtro.</p>';
    return;
  }

  repoGrid.innerHTML = reposToRender.map((repo) => repoTemplate(repo)).join("");
}

async function fetchRepos() {
  try {
    const response = await fetch(
      `https://api.github.com/users/${githubUser}/repos?per_page=100&sort=updated`
    );

    if (!response.ok) {
      throw new Error("No se pudieron cargar los repositorios.");
    }

    const repos = await response.json();
    cachedRepos = repos.filter((repo) => !repo.fork);

    paintStats(cachedRepos);
    renderRepos("all");
  } catch (error) {
    repoGrid.innerHTML =
      '<p class="empty-state">No se pudo conectar con GitHub en este momento.</p>';

    totalReposEl.textContent = "N/D";
    totalStarsEl.textContent = "N/D";
    topLanguageEl.textContent = "N/D";
    activeYearEl.textContent = "N/D";
  }
}

/* ===== EVENTS ===== */
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    renderRepos(button.dataset.filter);
  });
});

menuToggle.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
  });
});

document.addEventListener("click", (e) => {
  if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
    mainNav.classList.remove("open");
  }
});

fetchRepos();
