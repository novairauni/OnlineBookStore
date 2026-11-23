
// store books and shopping cart in arrays
let books = [];
let cart = [];

// get html elements using dom manipulation
const bookList = document.getElementById("book-list");
const bookForm = document.getElementById("book-form");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const formMessage = document.getElementById("form-message");

// api base url
const API_URL = "/books";

// function to get books from backend
const fetchBooks = async () => {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch books");
        }

        books = await response.json();

        displayBooks(books);

    } catch (error) {
        bookList.innerHTML =
            `<p class="text-danger">Unable to load books. Please refresh.</p>`;
    }
};

// function to display books using bootstrap cards
const displayBooks = (bookArray) => {

    bookList.innerHTML = "";

    // use map array method to generate book cards
    bookArray.map(book => {

        const column = document.createElement("div");

        column.className = "col-12 col-sm-6 col-lg-4";

        column.innerHTML = `
            <div class="card book-card shadow-sm">

                <img
                    src="${escapeHTML(book.image)}"
                    class="card-img-top book-cover"
                    alt="${escapeHTML(book.title)}"
                    onerror="this.src='https://placehold.co/200x280?text=Book'">

                <div class="card-body">

                    <h5 class="card-title">
                        ${escapeHTML(book.title)}
                    </h5>

                    <p class="text-muted mb-1">
                        By ${escapeHTML(book.author)}
                    </p>

                    <p class="badge bg-secondary align-self-start">
                        ${escapeHTML(book.category)}
                    </p>

                    <h6 class="text-success">
                        PKR ${Number(book.price).toLocaleString()}
                    </h6>

                    <button
                        class="btn btn-dark w-100 mb-2 add-cart"
                        data-id="${book.id}">
                        Add to Cart
                    </button>

                    <button
                        class="btn btn-outline-danger w-100 delete-book"
                        data-id="${book.id}">
                        Delete Book
                    </button>

                </div>
            </div>
        `;

        bookList.appendChild(column);

    });

};

// basic html escaping for user-provided text
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// function to validate book form
const validateForm = (title, author, price, category, image) => {

    if (!title.trim() || !author.trim() || !category) {
        return "Please fill all required fields.";
    }

    if (Number(price) <= 0 || !Number.isFinite(Number(price))) {
        return "Price must be greater than zero.";
    }

    if (image && !/^https?:\/\//i.test(image)) {
        return "Please enter a valid image URL.";
    }

    return "";
};

// event listener for adding a book
bookForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    // get form values
    const title = document.getElementById("title").value;
    const author = document.getElementById("author").value;
    const price = document.getElementById("price").value;
    const category = document.getElementById("category").value;
    const image = document.getElementById("image").value;

    // validate form
    const error = validateForm(title, author, price, category, image);

    if (error) {
        formMessage.textContent = error;
        formMessage.className = "text-danger mt-3";
        return;
    }

    try {
        // send post request to backend
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                author,
                price: Number(price),
                category,
                image
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        // reset form and update books
        bookForm.reset();

        formMessage.textContent = "Book added successfully!";
        formMessage.className = "text-success mt-3";

        await fetchBooks();

    } catch (error) {
        formMessage.textContent = error.message;
        formMessage.className = "text-danger mt-3";
    }

});

// event delegation for book buttons
bookList.addEventListener("click", async (event) => {

    const cartButton = event.target.closest(".add-cart");
    const deleteButton = event.target.closest(".delete-book");

    // add selected book to cart
    if (cartButton) {

        const id = Number(cartButton.dataset.id);

        addToCart(id);
    }

    // delete selected book
    if (deleteButton) {

        const id = Number(deleteButton.dataset.id);

        if (!confirm("Are you sure you want to delete this book?")) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            // remove deleted book from shopping cart
            cart = cart.filter(item => item.id !== id);

            renderCart();

            await fetchBooks();

        } catch (error) {
            alert(error.message);
        }
    }

});

// function to add books to cart
const addToCart = (id) => {

    // find selected book using find method
    const selectedBook = books.find(book => book.id === id);

    if (!selectedBook) return;

    // check if book already exists in cart
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart = [...cart, { ...selectedBook, quantity: 1 }];
    }

    renderCart();
};

// function to display cart
const renderCart = () => {

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML =
            `<p class="text-muted">Your cart is empty.</p>`;
    }

    // display each cart item
    cart.forEach(item => {

        const div = document.createElement("div");

        div.className =
            "list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2";

        div.innerHTML = `
            <div>
                <strong>${escapeHTML(item.title)}</strong>
                <br>
                <small>PKR ${item.price} × ${item.quantity}</small>
            </div>

            <div>
                <button class="btn btn-sm btn-outline-secondary decrease"
                    data-id="${item.id}">-</button>

                <span class="mx-2">${item.quantity}</span>

                <button class="btn btn-sm btn-outline-secondary increase"
                    data-id="${item.id}">+</button>

                <button class="btn btn-sm btn-danger remove-cart"
                    data-id="${item.id}">Remove</button>
            </div>
        `;

        cartItems.appendChild(div);
    });

    // calculate cart total using reduce
    const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    // update cart information in dom
    cartTotal.textContent = total.toLocaleString();

    cartCount.textContent = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

};

// shopping cart button events
cartItems.addEventListener("click", (event) => {

    const id = Number(event.target.dataset.id);

    if (!id) return;

    const item = cart.find(item => item.id === id);

    if (!item) return;

    // increase item quantity
    if (event.target.classList.contains("increase")) {
        item.quantity++;
    }

    // decrease item quantity
    if (event.target.classList.contains("decrease")) {
        item.quantity--;

        if (item.quantity <= 0) {
            cart = cart.filter(item => item.id !== id);
        }
    }

    // remove item from cart
    if (event.target.classList.contains("remove-cart")) {
        cart = cart.filter(item => item.id !== id);
    }

    renderCart();

});

// clear shopping cart
document.getElementById("clear-cart").addEventListener("click", () => {

    cart = [];

    renderCart();

});

// search books using filter method
document.getElementById("search-input").addEventListener("input", (event) => {

    const searchValue = event.target.value.toLowerCase();

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchValue) ||
        book.author.toLowerCase().includes(searchValue) ||
        book.category.toLowerCase().includes(searchValue)
    );

    displayBooks(filteredBooks);

});

// load books when page opens
fetchBooks();

// display empty cart initially
renderCart();
