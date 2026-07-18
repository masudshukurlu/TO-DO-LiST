// Bütün sorğular bu helper-dən keçir: xəta olanda istifadəçiyə mesaj göstərir
async function apiFetch(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
        let message = 'Xəta baş verdi';
        try {
            const body = await res.json();
            if (body && body.message) message = body.message;
        } catch (e) { /* body JSON deyil */ }
        alert(message);
        throw new Error(message);
    }
    if (res.status === 204) return null;
    return res.json();
}

const jsonOptions = (method, data) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

const api = {
    listProjects: () => apiFetch('/api/projects'),
    createProject: (name) => apiFetch('/api/projects', jsonOptions('POST', { name })),
    updateProject: (id, name) => apiFetch('/api/projects/' + id, jsonOptions('PUT', { name })),
    deleteProject: (id) => apiFetch('/api/projects/' + id, { method: 'DELETE' }),

    listTasks: (projectId) => apiFetch('/api/projects/' + projectId + '/tasks'),
    createTask: (projectId, title, description) =>
        apiFetch('/api/projects/' + projectId + '/tasks', jsonOptions('POST', { title, description })),
    createSubtask: (parentId, title, description) =>
        apiFetch('/api/tasks/' + parentId + '/subtasks', jsonOptions('POST', { title, description })),
    updateTask: (id, title, description) =>
        apiFetch('/api/tasks/' + id, jsonOptions('PUT', { title, description })),
    toggleTask: (id) => apiFetch('/api/tasks/' + id + '/toggle', { method: 'PUT' }),
    deleteTask: (id) => apiFetch('/api/tasks/' + id, { method: 'DELETE' })
};

let activeProjectId = null;

const projectList = document.getElementById('project-list');
const tasksEl = document.getElementById('tasks');
const workspaceTitle = document.getElementById('workspace-title');
const newTaskBtn = document.getElementById('new-task-btn');
const welcome = document.getElementById('welcome');

// Açıq menyuları bağla (kənara klik edəndə)
document.addEventListener('click', () => {
    document.querySelectorAll('.menu-dropdown.open').forEach(m => m.classList.remove('open'));
});

function toggleMenu(event, dropdown) {
    event.stopPropagation();
    const isOpen = dropdown.classList.contains('open');
    document.querySelectorAll('.menu-dropdown.open').forEach(m => m.classList.remove('open'));
    if (!isOpen) dropdown.classList.add('open');
}

// Menyu düyməsi yaratmaq üçün köməkçi
function menuItem(label, isAction, onClick) {
    const btn = document.createElement('button');
    if (isAction) btn.className = 'menu-action';
    btn.textContent = label;
    btn.onclick = (e) => {
        e.stopPropagation();
        onClick();
    };
    return btn;
}

// ---- Projects ----
async function loadProjects() {
    const projects = await api.listProjects();
    projectList.innerHTML = '';
    projects.forEach(renderProjectItem);
}

function renderProjectItem(project) {
    const li = document.createElement('li');
    li.className = 'project-item' + (project.id === activeProjectId ? ' active' : '');

    const label = document.createElement('span');
    label.textContent = project.name + ' (' + (project.taskCount || 0) + ')';
    label.onclick = () => openProject(project.id, project.name);

    const menu = document.createElement('div');
    menu.className = 'menu';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu-btn';
    menuBtn.textContent = '⋮';

    const dropdown = document.createElement('div');
    dropdown.className = 'menu-dropdown';
    dropdown.appendChild(menuItem('Edit', true, () => editProject(project)));
    dropdown.appendChild(menuItem('Delete', false, () => deleteProject(project.id)));

    menuBtn.onclick = (e) => toggleMenu(e, dropdown);

    menu.appendChild(menuBtn);
    menu.appendChild(dropdown);

    li.appendChild(label);
    li.appendChild(menu);
    projectList.appendChild(li);
}

async function createProject() {
    const name = prompt('Project adı:');
    if (name === null) return;
    if (!name.trim()) {
        alert('Project adı boş ola bilməz.');
        return;
    }
    const project = await api.createProject(name.trim());
    await loadProjects();
    openProject(project.id, project.name);
}

async function editProject(project) {
    const name = prompt('Yeni project adı:', project.name);
    if (name === null) return;
    if (!name.trim()) {
        alert('Project adı boş ola bilməz.');
        return;
    }
    await api.updateProject(project.id, name.trim());
    if (project.id === activeProjectId) {
        workspaceTitle.textContent = name.trim();
    }
    await loadProjects();
}

async function deleteProject(id) {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    await api.deleteProject(id);
    if (id === activeProjectId) {
        activeProjectId = null;
        showWelcome();
    }
    await loadProjects();
}

// ---- Workspace ----
function showWelcome() {
    welcome.style.display = 'flex';
    newTaskBtn.style.display = 'none';
    workspaceTitle.textContent = 'Workspace';
    tasksEl.innerHTML = '';
}

async function openProject(id, name) {
    activeProjectId = id;
    welcome.style.display = 'none';
    newTaskBtn.style.display = 'inline-block';
    workspaceTitle.textContent = name;
    await loadTasks();
    // sidebar-da aktiv seçimi yenilə
    await loadProjects();
}

// ---- Tasks ----
async function loadTasks() {
    const tasks = await api.listTasks(activeProjectId);
    tasksEl.innerHTML = '';
    if (tasks.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty';
        p.textContent = 'Hələ task yoxdur.';
        tasksEl.appendChild(p);
        return;
    }
    tasks.forEach(task => {
        renderTaskCard(task, false);
        (task.subtasks || []).forEach(sub => renderTaskCard(sub, true));
    });
}

function renderTaskCard(task, isSubtask) {
    const card = document.createElement('div');
    card.className = 'task-card' + (task.completed ? ' done' : '') + (isSubtask ? ' subtask' : '');

    const left = document.createElement('div');
    left.className = 'task-title';

    const titleEl = document.createElement('div');
    titleEl.textContent = task.title;
    left.appendChild(titleEl);

    if (task.description && task.description.trim()) {
        const descEl = document.createElement('div');
        descEl.className = 'task-desc';
        descEl.textContent = task.description;
        left.appendChild(descEl);
    }

    const right = document.createElement('div');
    right.className = 'task-right';

    const menu = document.createElement('div');
    menu.className = 'menu';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu-btn';
    menuBtn.textContent = '⋮';

    const dropdown = document.createElement('div');
    dropdown.className = 'menu-dropdown';
    dropdown.appendChild(menuItem('Edit', true, () => editTask(task)));
    // Add Subtask yalnız main task-larda olur
    if (!isSubtask) {
        dropdown.appendChild(menuItem('Add Subtask', true, () => addSubtask(task.id)));
    }
    dropdown.appendChild(menuItem('Delete', false, () => deleteTask(task.id)));

    menuBtn.onclick = (e) => toggleMenu(e, dropdown);
    menu.appendChild(menuBtn);
    menu.appendChild(dropdown);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.onclick = () => toggleTask(task.id);

    right.appendChild(menu);
    right.appendChild(checkbox);

    card.appendChild(left);
    card.appendChild(right);
    tasksEl.appendChild(card);
}

async function createTask() {
    const title = prompt('Task adı:');
    if (title === null) return;
    if (!title.trim()) {
        alert('Task adı boş ola bilməz.');
        return;
    }
    const description = prompt('Task təsviri (istəyə bağlı):') || '';
    await api.createTask(activeProjectId, title.trim(), description.trim());
    await loadTasks();
    await loadProjects();
}

async function addSubtask(parentId) {
    const title = prompt('Subtask adı:');
    if (title === null) return;
    if (!title.trim()) {
        alert('Subtask adı boş ola bilməz.');
        return;
    }
    const description = prompt('Subtask təsviri (istəyə bağlı):') || '';
    await api.createSubtask(parentId, title.trim(), description.trim());
    await loadTasks();
}

async function editTask(task) {
    const title = prompt('Yeni title:', task.title);
    if (title === null) return;
    if (!title.trim()) {
        alert('Title boş ola bilməz.');
        return;
    }
    const description = prompt('Yeni təsvir (istəyə bağlı):', task.description || '') || '';
    await api.updateTask(task.id, title.trim(), description.trim());
    await loadTasks();
}

async function toggleTask(id) {
    await api.toggleTask(id);
    await loadTasks();
}

async function deleteTask(id) {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    await api.deleteTask(id);
    await loadTasks();
    await loadProjects();
}

// ---- Init ----
document.getElementById('new-project-btn').onclick = createProject;
document.getElementById('sidebar-new-project-btn').onclick = createProject;
newTaskBtn.onclick = createTask;
loadProjects();
