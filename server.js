
// import required modules
const express = require("express");
const fs = require("fs");
const path = require("path");

// initialize express application
const app = express();
const PORT = 3000;

// define json database path
const filePath = path.join(__dirname, "data", "books.json");

// middleware to read json request bodies
app.use(express.json());

// serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

// function to read books from json file
function readBooks() {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
}

// function to save books into json file
function saveBooks(books) {
    fs.writeFileSync(filePath, JSON.stringify(books, null, 2));
}

// GET API - retrieve all books
app.get("/books", (req, res) => {
    try {
        const books = readBooks();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: "Unable to retrieve books" });
    }
});

// POST API - add a new book
app.post("/books", (req, res) => {
    try {
        const { title, author, price, category, image } = req.body;

        // validate required fields
        if (!title || !author || !category ||
            price === undefined || !Number.isFinite(Number(price)) ||
            Number(price) <= 0) {
            return res.status(400).json({
                message: "Enter valid title, author, category and positive price"
            });
        }

        const books = readBooks();

        // generate a unique book id
        const newBook = {
            id: books.length > 0
                ? Math.max(...books.map(book => book.id)) + 1
                : 1,
            title: title.trim(),
            author: author.trim(),
            price: Number(price),
            category: category.trim(),
            image: image || "https://placehold.co/200x280?text=Book"
        };

        // add new book to array
        books.push(newBook);

        // update json database
        saveBooks(books);

        res.status(201).json({
            message: "Book added successfully",
            book: newBook
        });

    } catch (error) {
        res.status(500).json({ message: "Unable to add book" });
    }
});

// DELETE API - delete book using id
app.delete("/books/:id", (req, res) => {
    try {
        const id = Number(req.params.id);
        const books = readBooks();

        // check if book exists
        const bookExists = books.some(book => book.id === id);

        if (!bookExists) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        // remove selected book
        const updatedBooks = books.filter(book => book.id !== id);

        // save updated database
        saveBooks(updatedBooks);

        res.status(200).json({
            message: "Book deleted successfully"
        });

    } catch (error) {
        res.status(500).json({ message: "Unable to delete book" });
    }
});

// start server
app.listen(PORT, () => {
    console.log(`Online Book Store running at http://localhost:${PORT}`);
});
