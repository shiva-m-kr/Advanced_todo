// ================== DOM ELEMENTS ==================
var taskInput     = document.getElementById("taskInput");
var prioritySelect = document.getElementById("prioritySelect");
var addTaskBtn    = document.getElementById("addTaskBtn");
var taskContainer = document.getElementById("taskContainer");
const totalTasks     = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");

let tasks = [];
let activeFilter = "all";
let activeSort   = "newest";


// ================== STATS ==================
function updateTaskStats() {
    totalTasks.textContent     = tasks.length;
    completedTasks.textContent = tasks.filter(t => t.completed).length;
}


// ================== FORMAT DATE ==================
function formatDateTime(ts) {
    if (!ts) return "Unknown";
    const d = new Date(ts);
    const pad = n => String(n).padStart(2,"0");
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


// ================== TIME DIFF ==================
function getTimeDiff(start, end) {
    const m = Math.floor((end - start) / 60000);
    if (m < 60)  return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ${m % 60}m`;
    return `${Math.floor(h/24)}d ${h%24}h`;
}


// ================== STATS MODAL ==================
function showStatsModal(task) {
    document.getElementById("statsModal")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "statsModal";
    overlay.className = "modal-overlay";

    const priorityColor = { high:"#ef4444", medium:"#f59e0b", low:"#10b981" }[task.priority];

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span>📊 Task Stats</span>
          <button class="modal-close" id="modalClose">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-row"><span class="ml">📝 Task</span><span class="mv">${task.text}</span></div>
          <div class="modal-row"><span class="ml">🚦 Priority</span><span class="mv" style="color:${priorityColor}">${task.priority.charAt(0).toUpperCase()+task.priority.slice(1)}</span></div>
          <div class="modal-row"><span class="ml">✅ Status</span><span class="mv">${task.completed?"Completed":"Pending"}</span></div>
          <div class="modal-row"><span class="ml">⭐ Important</span><span class="mv">${task.important?"Yes":"No"}</span></div>
          <div class="modal-row"><span class="ml">🕐 Added</span><span class="mv">${formatDateTime(task.createdAt)}</span></div>
          ${task.completedAt ? `<div class="modal-row"><span class="ml">🏁 Completed</span><span class="mv">${formatDateTime(task.completedAt)}</span></div>` : ""}
          ${task.completedAt ? `<div class="modal-row"><span class="ml">⏱ Time Taken</span><span class="mv">${getTimeDiff(task.createdAt,task.completedAt)}</span></div>` : ""}
        </div>
      </div>`;

    document.body.appendChild(overlay);
    document.getElementById("modalClose").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
}


// ================== RENDER TASK ==================
function renderTask(task) {
    const li = document.createElement("li");
    li.className = `task-card priority-${task.priority}`;
    li.dataset.id = task.id;
    if (task.completed) li.classList.add("completed");
    if (task.important) li.classList.add("important");

    // Top row: text + star
    const topRow = document.createElement("div");
    topRow.className = "card-top";

    const taskText = document.createElement("span");
    taskText.className = "task-text";
    taskText.textContent = task.text;

    const starBtn = document.createElement("button");
    starBtn.className = "icon-btn star-btn" + (task.important ? " starred" : "");
    starBtn.title = "Star";
    starBtn.innerHTML = task.important ? "★" : "☆";

    topRow.appendChild(taskText);
    topRow.appendChild(starBtn);

    // Meta row: date + priority badge
    const metaRow = document.createElement("div");
    metaRow.className = "card-meta";

    const dateBadge = document.createElement("span");
    dateBadge.className = "date-badge";
    dateBadge.textContent = formatDateTime(task.createdAt);

    const priiBadge = document.createElement("span");
    priiBadge.className = `pri-badge pri-${task.priority}`;
    priiBadge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

    metaRow.appendChild(dateBadge);
    metaRow.appendChild(priiBadge);

    // Action row: icon buttons (shown on hover via CSS)
    const actionRow = document.createElement("div");
    actionRow.className = "card-actions";

    const doneBtn  = document.createElement("button");
    doneBtn.className = "icon-btn done-btn";
    doneBtn.title = task.completed ? "Mark undone" : "Mark done";
    doneBtn.innerHTML = task.completed ? "↩" : "✓";

    const editBtn  = document.createElement("button");
    editBtn.className = "icon-btn edit-btn";
    editBtn.title = "Edit";
    editBtn.innerHTML = "✏";

    const statsBtn = document.createElement("button");
    statsBtn.className = "icon-btn stats-btn";
    statsBtn.title = "Stats";
    statsBtn.innerHTML = "📊";

    const delBtn   = document.createElement("button");
    delBtn.className = "icon-btn del-btn";
    delBtn.title = "Delete";
    delBtn.innerHTML = "🗑";

    actionRow.appendChild(doneBtn);
    actionRow.appendChild(editBtn);
    actionRow.appendChild(statsBtn);
    actionRow.appendChild(delBtn);

    li.appendChild(topRow);
    li.appendChild(metaRow);
    li.appendChild(actionRow);
    taskContainer.appendChild(li);

    // ---- Events ----

    starBtn.addEventListener("click", () => {
        task.important = !task.important;
        starBtn.innerHTML = task.important ? "★" : "☆";
        starBtn.classList.toggle("starred", task.important);
        li.classList.toggle("important", task.important);
        saveTasks();
        applyFilterAndSort();
    });

    doneBtn.addEventListener("click", () => {
        task.completed = !task.completed;
        task.completedAt = task.completed ? Date.now() : undefined;
        li.classList.toggle("completed", task.completed);
        doneBtn.innerHTML = task.completed ? "↩" : "✓";
        doneBtn.title = task.completed ? "Mark undone" : "Mark done";
        saveTasks();
        updateTaskStats();
        applyFilterAndSort();
    });

    editBtn.addEventListener("click", () => {
        taskInput.value      = task.text;
        prioritySelect.value = task.priority;
        tasks.splice(tasks.indexOf(task), 1);
        saveTasks();
        li.remove();
        updateTaskStats();
        taskInput.focus();
    });

    statsBtn.addEventListener("click", () => showStatsModal(task));

    delBtn.addEventListener("click", () => {
        tasks.splice(tasks.indexOf(task), 1);
        saveTasks();
        li.remove();
        updateTaskStats();
    });

    updateTaskStats();
}


// ================== ADD TASK ==================
function handleAddTask() {
    const val = taskInput.value.trim();
    if (!val) { alert("Task cannot be empty"); return; }

    const now = Date.now();
    const task = { id: now, text: val, priority: prioritySelect.value,
                   completed: false, important: false, createdAt: now };
    tasks.push(task);
    saveTasks();
    applyFilterAndSort();
    taskInput.value = "";
    taskInput.focus();
}


// ================== LOCAL STORAGE ==================
function saveTasks() { localStorage.setItem("taskflow_tasks", JSON.stringify(tasks)); }

function loadTasks() {
    const raw = localStorage.getItem("taskflow_tasks");
    if (raw) {
        tasks = JSON.parse(raw);
        tasks.forEach(t => {
            if (!t.id)        t.id        = Date.now() + Math.random();
            if (!t.important) t.important = false;
            if (!t.createdAt) t.createdAt = Date.now();
        });
    }
}


// ================== FILTER & SORT ==================
function applyFilterAndSort() {
    let f;
    switch (activeFilter) {
        case "completed": f = tasks.filter(t =>  t.completed); break;
        case "pending":   f = tasks.filter(t => !t.completed); break;
        case "important": f = tasks.filter(t =>  t.important); break;
        default:          f = [...tasks];
    }
    const po = { high:0, medium:1, low:2 };
    switch (activeSort) {
        case "oldest":   f.sort((a,b) => a.createdAt - b.createdAt); break;
        case "priority": f.sort((a,b) => po[a.priority] - po[b.priority]); break;
        default:         f.sort((a,b) => b.createdAt - a.createdAt);
    }
    taskContainer.innerHTML = "";
    f.forEach(renderTask);
    updateTaskStats();
}


// ================== THEME ==================
function applyTheme(theme) {
    document.body.classList.toggle("light-theme", theme === "light");
    localStorage.setItem("taskflow_theme", theme);
    document.querySelector(".theme-toggle-night")?.classList.toggle("active-theme", theme === "dark");
    document.querySelector(".theme-toggle-day")?.classList.toggle("active-theme",  theme === "light");
}
function loadTheme()  { applyTheme(localStorage.getItem("taskflow_theme") || "dark"); }
function setupThemeToggles() {
    document.querySelector(".theme-toggle-night")?.addEventListener("click", () => applyTheme("dark"));
    document.querySelector(".theme-toggle-day")?.addEventListener("click",   () => applyTheme("light"));
}


// ================== NAV (filter) ==================
function setupNavButtons() {
    const map = { "All Tasks":"all","Completed":"completed","Pending":"pending","Important":"important" };
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeFilter = map[btn.textContent.trim()] || "all";
            applyFilterAndSort();
        });
    });
}


// ================== SORT BUTTONS ==================
function setupFilterButtons() {
    const map = { "Newest":"newest","Oldest":"oldest","Priority":"priority" };
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const s = map[btn.textContent.trim()];
            if (s) { activeSort = s; applyFilterAndSort(); }
        });
    });
}


// ================== SEARCH ==================
document.getElementById("searchInput").addEventListener("input", function () {
    const q = this.value.toLowerCase().trim();
    document.querySelectorAll(".task-card").forEach(card => {
        const t = card.querySelector(".task-text").textContent.toLowerCase();
        card.style.display = t.includes(q) ? "" : "none";
    });
});


// ================== KEYBOARD ==================
taskInput.addEventListener("keydown", e => {
    if (e.key === "Enter")                          handleAddTask();
    else if (e.key === "ArrowUp")   { e.preventDefault(); prioritySelect.value = "high"; }
    else if (e.key === "ArrowDown") { e.preventDefault(); prioritySelect.value = "low"; }
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); prioritySelect.value = "medium"; }
});
addTaskBtn.addEventListener("click", handleAddTask);


// ================== INIT ==================
loadTheme();
loadTasks();
applyFilterAndSort();
setupNavButtons();
setupFilterButtons();
setupThemeToggles();