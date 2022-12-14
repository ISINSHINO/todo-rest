(function init() {
  const ENTER = 'Enter';
  const ESCAPE = 'Escape';

  const baseURL = 'http://localhost:8000/';

  const list = document.querySelector('.list-group');

  const taskInput = document.querySelector('.form-control');

  const addButton = document.querySelector('.btn-primary');

  const toggleAll = document.querySelector('.form-check-input');

  const clearCompletedButton = document.querySelector('.btn-light');

  const tabContainer = document.querySelector('.nav-tabs');
  const tabs = document.querySelectorAll('.nav-item');
  const tabsLinks = document.querySelectorAll('.nav-link');

  const pagination = document.querySelector('.pagination');

  const toastContainer = document.querySelector('.toast-container');

  const elementsByPage = 5;
  let page = 1;
  let pages = [];

  let tasksCount = 0;
  let activeTasks = 0;
  let completedTasks = 0;
  let allTasks = 0;

  let tasks = [];
  let futureStatus = true;
  let status = 'all';

  const { _ } = window;

  const createToast = (toastMessage) => {
    const newToast = document.createElement('div');
    newToast.classList.add('toast', 'toast-danger', 'show');

    const newToastBody = document.createElement('div');
    newToastBody.classList.add('toast-body');
    newToastBody.textContent = toastMessage || 'Something went wrong';

    newToast.append(newToastBody);
    toastContainer.append(newToast);

    setTimeout(() => {
      newToast.remove();
    }, 1500);
  };

  const fetchTasks = () => {
    fetch(`${baseURL}tasks/?page=${page}&status=${status}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error();
      })
      .then((data) => {
        tasks = data.results;
        tasksCount = data.count;
        allTasks = data.all;
        activeTasks = data.active;
        completedTasks = data.completed;
        render();
      })
      .catch((error) => createToast(error.message));
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

    const changeNameByID = (value) => {
      if (normalizeStr(value)) {
        fetch(`${baseURL}tasks/${modifyingTodoID}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: normalizeStr(value) }),
        })
          .then((response) => {
            if (response.ok) {
              fetchTasks();
            } else {
              throw new Error();
            }
          })
          .catch((error) => createToast(error.message));
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
    const prevPageValue = page;
    switch (event.target.textContent.trim()) {
      case '??':
        if (page !== 1 && tasks.length) {
          page -= 1;
        } else {
          page = pages.length;
        }
        fetchTasks();
        break;
      case '??':
        if (page !== pages.length && tasks.length) {
          page += 1;
        } else {
          page = 1;
        }
        fetchTasks();
        break;
      default:
        if (event.target.tagName.toLowerCase() === 'a') {
          page = +event.target.textContent;
          if (page !== prevPageValue) {
            fetchTasks();
          }
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
    const tabStatus = getTabName(iterTab).toLowerCase();
    if (tabStatus !== status) {
      iterTab.classList.remove('active');
    } else {
      iterTab.classList.add('active');
    }
  };

  const changeCurrentTab = (event) => {
    const currentTab = getTabName(event.target).toLowerCase();
    if (status !== currentTab) {
      status = currentTab;
      page = 1;
      tabs.forEach((tab) => toggleTab(tab));
      fetchTasks();
    }
  };

  const addTodo = (event) => {
    event.preventDefault();
    if ((event.type === 'click') && normalizeStr(taskInput.value).length) {
      const currentTask = {
        name: normalizeStr(taskInput.value),
        completed: false,
      };

      taskInput.value = '';

      fetch(`${baseURL}tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTask),
      })
        .then((response) => {
          if (response.ok) {
            if (tasksCount && (tasksCount % elementsByPage === 0) && status !== 'completed') {
              if (page !== pages.length) {
                page = pages.length + 1;
              } else {
                page += 1;
              }
            }
            fetchTasks();
          } else {
            throw new Error();
          }
        })
        .catch((error) => createToast(error.message));
    }
  };

  const deleteTodo = (modifyingTodoID) => {
    fetch(`${baseURL}tasks/${modifyingTodoID}/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        if (response.ok) {
          if ((tasks.length === 1) && page === pages.length && page - 1 !== 0) {
            page -= 1;
          }
          fetchTasks();
        } else {
          throw new Error();
        }
      })
      .catch((error) => createToast(error.message));
  };

  const checkTodo = (modifyingTodoID) => {
    const numberTasks = tasks.length % elementsByPage;
    if ((numberTasks - 1 === 0) && page === pages.length && page - 1 !== 0 && status !== 'all') {
      page -= 1;
    }

    const currentTask = tasks.find((task) => task.id === +modifyingTodoID);

    fetch(`${baseURL}tasks/${modifyingTodoID}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !currentTask.completed }),
    })
      .then((response) => {
        if (response.ok) {
          fetchTasks();
        } else {
          throw new Error();
        }
      })
      .catch((error) => createToast(error.message));
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

  const checkAll = () => {
    fetch(`${baseURL}complete-all/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: futureStatus }),
    })
      .then((response) => {
        if (response.ok) {
          futureStatus = !futureStatus;
          page = 1;
          fetchTasks();
        } else {
          throw new Error();
        }
      })
      .catch((error) => createToast(error.message));
  };

  const clearCompleted = () => {
    fetch(`${baseURL}clear-completed/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        if (response.ok) {
          fetchTasks();
        } else {
          throw new Error();
        }
      })
      .catch((error) => createToast(error.message));
  };

  tabContainer.addEventListener('click', changeCurrentTab);
  list.addEventListener('click', modifyList);
  addButton.addEventListener('click', addTodo);
  taskInput.addEventListener('keyup', addTodo);
  toggleAll.addEventListener('click', checkAll);
  clearCompletedButton.addEventListener('click', clearCompleted);

  document.addEventListener('DOMContentLoaded', fetchTasks);
}());
