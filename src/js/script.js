const githubUser = "luisalvacelis";
const repoGrid = document.getElementById("repositories");
const filterButtons = document.querySelectorAll(".filter-btn");

const totalReposEl = document.getElementById("total-repos");
const totalStarsEl = document.getElementById("total-stars");
const topLanguageEl = document.getElementById("top-language");
const activeYearEl = document.getElementById("active-year");

const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

let cachedRepos = [];

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

function paintStats(repos) {
  const totalStars = repos.reduce(
    (sum, repo) => sum + (repo.stargazers_count || 0),
    0
  );

  const lastUpdate = repos[0]?.updated_at;

  totalReposEl.textContent = String(repos.length);
  totalStarsEl.textContent = String(totalStars);
  topLanguageEl.textContent = getTopLanguage(repos);
  activeYearEl.textContent = lastUpdate
    ? String(new Date(lastUpdate).getFullYear())
    : "N/D";
}

function repoTemplate(repo) {
  const description = repo.description || "Proyecto en evoluci\u00f3n con enfoque pr\u00e1ctico.";
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

function renderRepos(filter = "all") {
  let reposToRender = [...cachedRepos];

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

fetchRepos();
