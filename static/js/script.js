// ...existing code...
document.addEventListener("DOMContentLoaded", () => {
  // --- Add Book ---
  document.getElementById("add-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("add-id").value.trim();
    const title = document.getElementById("add-title").value.trim();
    const author = document.getElementById("add-author").value.trim();

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title, author }),
      });

      const data = await res.json().catch(() => ({ message: "Invalid response" }));
      document.getElementById("add-msg").textContent = data.message || (res.ok ? "Added" : "Error");

      if (res.ok) {
        e.target.reset();
        refreshList();
      }
    } catch (err) {
      document.getElementById("add-msg").textContent = "Network error";
    }
  });

  // --- Update Book ---
  document.getElementById("update-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("upd-id").value.trim();
    const title = document.getElementById("upd-title").value.trim();
    const author = document.getElementById("upd-author").value.trim();

    try {
      const res = await fetch(`/api/books/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || undefined, author: author || undefined }),
      });

      const data = await res.json().catch(() => ({ message: "Invalid response" }));
      document.getElementById("update-msg").textContent = data.message || (res.ok ? "Updated" : "Error");

      if (res.ok) {
        e.target.reset();
        refreshList();
      }
    } catch (err) {
      document.getElementById("update-msg").textContent = "Network error";
    }
  });

  // --- Search Book ---
  document.getElementById("search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("search-id").value.trim();
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => null);
      const out = document.getElementById("search-result");
      if (res.ok && data) {
        out.textContent = JSON.stringify(data, null, 2);
      } else {
        out.textContent = (data && data.message) ? data.message : "Book not found";
      }
    } catch (err) {
      document.getElementById("search-result").textContent = "Network error";
    }
  });

  // --- Refresh List ---
  document.getElementById("refresh").addEventListener("click", refreshList);

  async function refreshList() {
    try {
      const res = await fetch("/api/books");
      const books = await res.json().catch(() => []);
      const tbody = document.querySelector("#books-table tbody");
      tbody.innerHTML = "";

      books.forEach((book) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${escapeHtml(book.id)}</td>
          <td>${escapeHtml(book.title)}</td>
          <td>${escapeHtml(book.author)}</td>
          <td><button data-id="${encodeURIComponent(book.id)}" class="delete-btn danger">Delete</button></td>
        `;
        tbody.appendChild(row);
      });

      // Attach delete handlers
      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = decodeURIComponent(btn.dataset.id);
          try {
            const res = await fetch(`/api/books/${encodeURIComponent(id)}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({ message: "Invalid response" }));
            document.getElementById("list-msg").textContent = data.message || (res.ok ? "Deleted" : "Error");
            if (res.ok) {
              btn.closest("tr").remove();
            }
          } catch (err) {
            document.getElementById("list-msg").textContent = "Network error";
          }
        });
      });
    } catch (err) {
      document.getElementById("list-msg").textContent = "Failed to load books";
    }
  }

  // simple html escape for table cells
  function escapeHtml(s = "") {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // initial load
  refreshList();
});
// ...existing code...