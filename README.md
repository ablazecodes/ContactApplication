# 📇 Contact Management App

Your go-to **full-stack** solution for managing contacts with detailed address info, built using **Node.js**, **Express**, **Mysql**, and **JavaScript**. Whether you’re organising your crew, managing clients, or just flexing those tech skills, this app’s got you covered.

---

## ✨ Features

- 🔍 **Search contacts** — Find anyone in seconds
- ➕ **Add new contacts** — New connections made easy
- 📝 **Edit contact info** — Inline address editing for that clean look
- 🗑️ **Delete contacts** — Remove with confidence (with confirmation 😜)
- 📧 **Email & Phone validation** — No more typos (we got your back)
- 🎨 **Sleek, minimalist UI** — Pure HTML, CSS, and JS (no frameworks, just clean code)

---

## 🛠 Tech Stack

- **Backend:** Node.js + Express (All the server-side magic)
- **Frontend:** HTML, CSS, JavaScript (Keeping it light and clean)
- **Database:** Mysql (Solid relational DB for all your contact data)

---

## 📦 Getting Started

Ready to dive in? Here’s how you can get this bad boy up and running!

### 1. Clone the repository

```bash
git clone https://github.com/ablazecodes/ContactApplication.git
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Set up the Mysql database
Open your Mysql client (CLI or GUI) and run the following SQL:

```bash
CREATE DATABASE contact_app;

USE contact_app;

CREATE TABLE contact (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    profile_img TEXT
);

CREATE TABLE address (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    type VARCHAR(50),
    street VARCHAR(255),
    state VARCHAR(100),
    country VARCHAR(100),
    FOREIGN KEY (customer_id) REFERENCES contact(id) ON DELETE CASCADE
);

```

### 4. Configure database connection
Update the Mysql configuration inside your server.js file:

```bash
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_mysql_user',
    password: 'your_mysql_password',
    database: 'contact_app'
});

```

### 5. Start the backend server
```bash
node server.js
```
The server will run on: http://localhost:3000

### 6. Launch the frontend
Just open index.html in your browser and you’re good to go. For an even smoother experience, use the Live Server extension in VSCode. 

## 🔌 API Endpoints

| Method | Endpoint         | Description            |
|--------|------------------|------------------------|
| GET    | `/contacts`      | Get all contacts       |
| GET    | `/contacts/:id`  | Get a single contact   |
| POST   | `/contacts`      | Add a new contact      |
| PUT    | `/contacts/:id`  | Update a contact       |
| DELETE | `/contact/:id`   | Delete a contact       |


## 🙌 Contributing
Got an idea or found a bug? Feel free to fork, PR, or hit me up. Contributions are always welcome—let’s level this up together. 

## 📄 License
This project is unlicensed, so feel free to use it, remix it, or just enjoy it! Make sure to give credit where credit’s due, though.


