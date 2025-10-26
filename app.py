from flask import Flask, jsonify, request, render_template
import json
import os


app = Flask(__name__, static_folder="static", template_folder="templates")
# --- Backend logic (same as your final code) ---

DATA_FILE = "library.json"

def load_data():
    try:
        if not os.path.exists(DATA_FILE):
            return []
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"❌ Error loading data: {e}")
        return []

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

def is_unique_id(book_id, books):
    return all(book["id"] != book_id for book in books)

def add_book(book_id, title, author):
    if not book_id.strip() or not title.strip() or not author.strip():
        return False, "❌ All fields are required!"
    books = load_data()
    if not is_unique_id(book_id, books):
        return False, f"❌ Book ID {book_id} already exists!"
    new_book = {"id": book_id, "title": title, "author": author}
    books.append(new_book)
    save_data(books)
    return True, f"✅ Book '{title}' added successfully!"

def update_book(book_id, new_title=None, new_author=None):
    if not book_id.strip():
        return False, "❌ Book ID is required!"
    books = load_data()
    for book in books:
        if book["id"] == book_id:
            if new_title:
                book["title"] = new_title
            if new_author:
                book["author"] = new_author
            save_data(books)
            return True, f"✅ Book {book_id} updated!"
    return False, f"❌ Book ID {book_id} not found."

def delete_book(book_id):
    books = load_data()
    updated_books = [book for book in books if book["id"] != book_id]
    if len(updated_books) == len(books):
        return False, f"❌ Book ID {book_id} not found."
    save_data(updated_books)
    return True, f"🗑️ Book {book_id} deleted."

def search_book(book_id):
    books = load_data()
    for book in books:
        if book["id"] == book_id:
            return True, book
    return False, f"❌ Book ID {book_id} not found."


# --- Flask routes (API + page) ---

@app.route("/")
def home():
    return render_template("index.html")

# List all books
@app.route("/api/books", methods=["GET"])
def api_list_books():
    return jsonify(load_data())

# Add a book
@app.route("/api/books", methods=["POST"])
def api_add_book():
    payload = request.get_json() or {}
    ok, msg = add_book(payload.get("id", ""), payload.get("title", ""), payload.get("author", ""))
    return jsonify({"success": ok, "message": msg}), (200 if ok else 400)

# Get one book by ID
@app.route("/api/books/<book_id>", methods=["GET"])
def api_get_book(book_id):
    ok, result = search_book(book_id)
    return jsonify(result if ok else {"success": False, "message": result}), (200 if ok else 404)

# Update a book
@app.route("/api/books/<book_id>", methods=["PUT"])
def api_update_book(book_id):
    payload = request.get_json() or {}
    ok, msg = update_book(book_id, payload.get("title"), payload.get("author"))
    return jsonify({"success": ok, "message": msg}), (200 if ok else 404)

# Delete a book
@app.route("/api/books/<book_id>", methods=["DELETE"])
def api_delete_book(book_id):
    ok, msg = delete_book(book_id)
    return jsonify({"success": ok, "message": msg}), (200 if ok else 404)

if __name__ == "__main__":
    app.run(debug=True)
