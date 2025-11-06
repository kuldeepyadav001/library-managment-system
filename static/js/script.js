document.addEventListener("DOMContentLoaded", () => {
  // Constants for messages and configurations
  const CONFIG = {
    messages: {
      networkError: "Network error - Please check your connection",
      invalidResponse: "Invalid server response",
      deleteConfirm: "Are you sure you want to delete this book?",
      loading: "Processing...",
      required: "This field is required",
      invalidId: "Book ID must be numeric",
      success: {
        add: "Book added successfully",
        update: "Book updated successfully",
        delete: "Book deleted successfully"
      }
    },
    apiEndpoints: {
      books: "/api/books"
    }
  };

  // Input validation helpers
  const validators = {
    required: value => (value && value.trim()) ? null : CONFIG.messages.required,
    numeric: value => /^\d+$/.test(value) ? null : CONFIG.messages.invalidId
  };

  function validateBook(id, title, author, requireAll = true) {
    const errors = {};
    if (requireAll || id) errors.id = validators.required(id) || validators.numeric(id);
    if (requireAll || title) errors.title = validators.required(title);
    if (requireAll || author) errors.author = validators.required(author);
    return Object.values(errors).filter(Boolean);
  }

  // UI helpers
  function setLoading(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (element) {
      element.disabled = isLoading;
      if (isLoading) {
        element.dataset.originalText = element.textContent;
        element.textContent = CONFIG.messages.loading;
      } else {
        element.textContent = element.dataset.originalText || element.textContent;
      }
    }
  }

  function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.className = `msg ${isError ? 'error' : 'success'}`;
      setTimeout(() => element.textContent = '', 5000); // Clear after 5s
    }
  }

  // API helpers
  async function apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });
      const data = await response.json();
      return { ok: response.ok, data };
    } catch (error) {
      console.error('API Error:', error);
      throw new Error(CONFIG.messages.networkError);
    }
  }

  // --- Add Book ---
  document.getElementById("add-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("add-id").value.trim();
    const title = document.getElementById("add-title").value.trim();
    const author = document.getElementById("add-author").value.trim();

    const errors = validateBook(id, title, author);
    if (errors.length) {
      showMessage("add-msg", errors[0], true);
      return;
    }

    setLoading("add-submit", true);
    try {
      const { ok, data } = await apiCall(CONFIG.apiEndpoints.books, {
        method: "POST",
        body: JSON.stringify({ id, title, author })
      });

      showMessage("add-msg", ok ? CONFIG.messages.success.add : data.message, !ok);
      if (ok) {
        e.target.reset();
        await refreshList();
      }
    } catch (error) {
      showMessage("add-msg", error.message, true);
    } finally {
      setLoading("add-submit", false);
    }
  });

  // --- Update Book ---
  document.getElementById("update-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("upd-id").value.trim();
    const title = document.getElementById("upd-title").value.trim();
    const author = document.getElementById("upd-author").value.trim();

    const errors = validateBook(id, false);
    if (errors.length) {
      showMessage("update-msg", errors[0], true);
      return;
    }

    setLoading("update-submit", true);
    try {
      const { ok, data } = await apiCall(`${CONFIG.apiEndpoints.books}/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ 
          title: title || undefined, 
          author: author || undefined 
        })
      });

      showMessage("update-msg", ok ? CONFIG.messages.success.update : data.message, !ok);
      if (ok) {
        e.target.reset();
        await refreshList();
      }
    } catch (error) {
      showMessage("update-msg", error.message, true);
    } finally {
      setLoading("update-submit", false);
    }
  });

  // --- Search Book ---
  document.getElementById("search-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("search-id").value.trim();
    
    const errors = validateBook(id, false);
    if (errors.length) {
      showMessage("search-result", errors[0], true);
      return;
    }

    setLoading("search-submit", true);
    try {
      const { ok, data } = await apiCall(`${CONFIG.apiEndpoints.books}/${encodeURIComponent(id)}`);
      const resultElement = document.getElementById("search-result");
      resultElement.textContent = ok ? JSON.stringify(data, null, 2) : data.message;
    } catch (error) {
      showMessage("search-result", error.message, true);
    } finally {
      setLoading("search-submit", false);
    }
  });

  // --- Refresh List ---
  async function refreshList() {
    setLoading("refresh", true);
    const tbody = document.querySelector("#books-table tbody");
    
    try {
      const { ok, data } = await apiCall(CONFIG.apiEndpoints.books);
      if (!ok || !Array.isArray(data)) {
        throw new Error(CONFIG.messages.invalidResponse);
      }

      tbody.innerHTML = data.map(book => `
        <tr>
          <td>${escapeHtml(book.id)}</td>
          <td>${escapeHtml(book.title)}</td>
          <td>${escapeHtml(book.author)}</td>
          <td>
            <button data-id="${encodeURIComponent(book.id)}" class="delete-btn danger">Delete</button>
          </td>
        </tr>
      `).join('');

      // Attach delete handlers
      document.querySelectorAll(".delete-btn").forEach(attachDeleteHandler);
    } catch (error) {
      showMessage("list-msg", error.message, true);
      tbody.innerHTML = '<tr><td colspan="4">Failed to load books</td></tr>';
    } finally {
      setLoading("refresh", false);
    }
  }

  function attachDeleteHandler(btn) {
    btn.addEventListener("click", async () => {
      if (!confirm(CONFIG.messages.deleteConfirm)) return;
      
      const id = decodeURIComponent(btn.dataset.id);
      setLoading(btn, true);
      
      try {
        const { ok, data } = await apiCall(`${CONFIG.apiEndpoints.books}/${encodeURIComponent(id)}`, {
          method: "DELETE"
        });

        showMessage("list-msg", ok ? CONFIG.messages.success.delete : data.message, !ok);
        if (ok) {
          btn.closest("tr").remove();
        }
      } catch (error) {
        showMessage("list-msg", error.message, true);
      } finally {
        if (!ok) setLoading(btn, false);
      }
    });
  }

  // Initialize
  refreshList();
});
