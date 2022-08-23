(function init() {
  const ENTER = 'Enter';
  const ESCAPE = 'Escape';

  const baseURL = 'http://127.0.0.1:8000/';

  const list = document.querySelector('.list-group');

  const taskInput = document.querySelector('.form-control');

  const addButton = document.querySelector('.btn-primary');

  const toggleAll = document.querySelector('.form-check-input');

  const clearCompletedButton = document.querySelector('.btn-light');

  const tabContainer = document.querySelector('.nav-tabs');
  const tabs = document.querySelectorAll('.nav-item');
  const tabsLinks = document.querySelectorAll('.nav-link');

  const pagination = document.querySelector('.pagination');

  const elementsByPage = 5;
  let page = 1;
  let pages = [];

  let tasksCount = 0;
  let activeTasks = 0;
  let completedTasks = 0;
  let allTasks = 0;

  let tasks = [];
  let futureStatus = true;
  let mode = 'all';

  const { _ } = window;

  const getTasksByMode = () => {
    let tasksToRender = [];
    switch (mode) {
      case 'All':
        tasksToRender = [...tasks];
        break;
      case 'Active':
        tasksToRender = tasks.filter((task) => !task.completed);
        break;
      case 'Completed':
        tasksToRender = tasks.filter((task) => task.completed);
        break;
      default:
        break;
    }
    return tasksToRender;
  };

  const getAllTasks = async (path = `tasks/?page=${page}`) => {
    const response = await fetch(`${baseURL}${path}&status=${mode}`); //  "http://127.0.0.1:8000/" + 'tasks/?page=1&status=' + 'all'
    const data = await response.json();
    tasks = data.results;
    tasksCount = data.count;
    allTasks = data.all;
    activeTasks = data.active;
    completedTasks = data.completed;
    render();
  };

  const getTabName = (name) => name.textContent.trim().split(' ')[0];

  const normalizeStr = (string) => _.escape(string.trim().replace(/\s+/g, ' '));

  const editTodo = (modifyingTodoID) => {
    const task = document.querySelector(`[data-id="${modifyingTodoID}"]`);
    const taskText = task.querySelector('.item-text');

    const previousText = taskText.textContent.trim();
    taskText.hidden = true;

    const deleteButton = task.querySelector('.text-primary');
    deleteButton.hidden = true;

    const editingInput = document.createElement('input');
    editingInput.value = previousText;

    const taskContainer = task.querySelector('.task-container');
    taskContainer.append(editingInput);
    editingInput.focus();

    // const currentTask = tasks.find((item) => item.id === +modifyingTodoID);

    const changeNameByID = async (value) => {
      if (normalizeStr(value)) {
        await fetch(`${baseURL}tasks/${modifyingTodoID}/`, {
          method: 'PATCH',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              name: normalizeStr(value),
              // checked: currentTask.completed,
            },
          ),
        });
        getAllTasks();
      }
    };

    const changeNameAndMakeVisible = (newText) => {
      taskText.hidden = false;
      deleteButton.hidden = false;
      changeNameByID(newText);
      editingInput.remove();
      render();
    };

    const confirmEditByBlur = () => {
      changeNameAndMakeVisible(editingInput.value);
    };

    const cancelEditByEscape = (event) => {
      if (event.key === ESCAPE) {
        editingInput.removeEventListener('blur', confirmEditByBlur);
        changeNameAndMakeVisible(previousText);
      }
    };

    const confirmEditByEnter = (event) => {
      if (event.key === ENTER) {
        editingInput.removeEventListener('blur', confirmEditByBlur);
        changeNameAndMakeVisible(editingInput.value);
      }
    };

    editingInput.addEventListener('keyup', cancelEditByEscape);

    editingInput.addEventListener('blur', confirmEditByBlur);

    editingInput.addEventListener('keyup', confirmEditByEnter);
  };

  const renderCounters = () => {
    tabsLinks.forEach((tabLink) => {
      const tab = tabLink;
      switch (getTabName(tabLink)) {
        case 'All':
          tab.textContent = `All ${allTasks}`;
          break;
        case 'Active':
          tab.textContent = `Active ${activeTasks}`;
          break;
        case 'Completed':
          tab.textContent = `Completed ${completedTasks}`;
          break;
        default:
          break;
      }
    });
  };

  const changePage = (event) => {
    switch (event.target.textContent.trim()) {
      case '«':
        if (page !== 1 && tasks.length) {
          page -= 1;
          getAllTasks();
        }
        break;
      case '»':
        if (page !== pages.length && tasks.length) {
          page += 1;
          getAllTasks();
        }
        break;
      default:
        if (event.target.tagName.toLowerCase() === 'a') {
          page = +event.target.textContent;
          getAllTasks();
        }
        break;
    }
  };

  const renderPagination = () => {
    pages = Array
      .from(Array(Math.ceil(tasksCount / elementsByPage)), (_, index) => index + 1);
    pagination.innerHTML = '';
    pagination.innerHTML += `
            <li class="page-item">
                <a class="page-link" href="#" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
            `;
    pages.forEach((pageItem) => {
      pagination.innerHTML += `
                    <li class="page-item ${+page === pageItem ? 'active' : ''}"><a class="page-link" href="#">${pageItem}</a></li>
                `;
    });
    pagination.innerHTML += `
            <li class="page-item">
                <a class="page-link" href="#" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
            `;

    pagination.addEventListener('click', changePage);
  };

  const toggleClearAllButton = () => {
    if (completedTasks) {
      clearCompletedButton.style.display = 'block';
    } else {
      clearCompletedButton.style.display = 'none';
    }
  };

  const toggleAllCheckbox = () => {
    if (activeTasks > 0 || allTasks === 0) {
      toggleAll.checked = false;
      futureStatus = true;
    }
    if (activeTasks === 0 && allTasks) {
      toggleAll.checked = true;
      futureStatus = false;
    }
  };

  const render = () => {
    list.innerHTML = '';
    pagination.innerHTML = '';

    if (tasks.length) {
      renderPagination();
    }

    tasks.forEach((task) => {
      list.innerHTML += `
              <li
              data-id="${task.id}"
              class="list-group-item d-flex justify-content-between align-items-center border-0 rounded mb-2 bg-light" 
              >
                  <div class="task-container d-flex align-items-center">
                      <input class="me-2 mt-0" ${task.completed ? 'checked' : ''} type="checkbox" value="" aria-label="..." />
                      <p class="${task.completed ? 'task-completed' : ''} item-text p-1 m-0 text-break">
                      ${task.name}
                      </p>
                  </div>
                  <a role="button" data-mdb-toggle="tooltip" title="Remove item">
                      <i class="fas fa-times text-primary"></i>
                  </a>
              </li>
              `;
    });
    toggleAllCheckbox();
    renderCounters();
    toggleClearAllButton();
  };

  const toggleTab = (tab) => {
    const iterTab = tab.querySelector('.nav-link');
    const tabMode = getTabName(iterTab).toLowerCase();
    if (tabMode !== mode) {
      iterTab.classList.remove('active');
    } else {
      iterTab.classList.add('active');
    }
  };

  const changeCurrentTab = (event) => {
    const currentTab = event.target;
    mode = getTabName(currentTab).toLowerCase();
    page = 1;
    tabs.forEach((tab) => toggleTab(tab));
    getAllTasks();
  };

  const addTodo = async (event) => {
    event.preventDefault();
    if ((event.code === ENTER || event.type === 'click') && normalizeStr(taskInput.value).length) {
      const currentTask = {
        name: normalizeStr(taskInput.value),
        completed: false,
      };
      taskInput.value = '';

      await fetch(`${baseURL}tasks/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentTask),
      });

      if (tasks.length && (tasks.length % elementsByPage === 0)) {
        if (page !== pages.length) {
          page = pages.length + 1;
        } else {
          page += 1;
        }
      }
      getAllTasks();
    }
  };

  const deleteTodo = async (modifyingTodoID) => {
    await fetch(`${baseURL}tasks/${modifyingTodoID}/`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    });
    if ((tasks.length === 1) && page === pages.length && page - 1 !== 0) {
      page -= 1;
    }
    getAllTasks();
  };

  const checkTodo = async (modifyingTodoID) => {
    const numberTasks = tasks.length % elementsByPage;
    if ((numberTasks - 1 === 0) && page === pages.length && page - 1 !== 0 && mode !== 'All') {
      page -= 1;
    }

    const currentTask = tasks.find((task) => task.id === +modifyingTodoID);

    await fetch(`${baseURL}tasks/${modifyingTodoID}/`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completed: !currentTask.completed }),
    });

    getAllTasks();
  };

  const modifyList = (event) => {
    const currentTodo = event.path[2];
    const modifyingTodoID = currentTodo.dataset.id;
    switch (event.target.tagName.toLowerCase()) {
      case 'p':
        if (event.detail === 2) {
          editTodo(modifyingTodoID);
        }
        break;
      case 'input':
        checkTodo(modifyingTodoID);
        break;
      case 'i':
        deleteTodo(modifyingTodoID);
        break;
      default:
        break;
    }
  };

  const checkAll = async () => {
    // page = 1;
    await fetch(`${baseURL}complete-all/`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completed: futureStatus }),
    });
    futureStatus = !futureStatus;
    getAllTasks();
  };

  const clearCompleted = async () => {
    await fetch(`${baseURL}clear-completed/`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    });
    getAllTasks();
  };

  tabContainer.addEventListener('click', changeCurrentTab);
  list.addEventListener('click', modifyList);
  addButton.addEventListener('click', addTodo);
  taskInput.addEventListener('keyup', addTodo);
  toggleAll.addEventListener('click', checkAll);
  clearCompletedButton.addEventListener('click', clearCompleted);

  getAllTasks();
}());
