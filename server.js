const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'SHReya@123',
    database: 'frontend'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

app.get('/contacts', (req, res) => {
    db.query('SELECT * FROM contact', (err, contacts) => {
        if (err) return res.status(500).json({ error: err.message });

        let remaining = contacts.length;
        if (remaining === 0) return res.json([]);

        contacts.forEach((contact, index) => {
            db.query('SELECT * FROM address WHERE customer_id = ?', [contact.id], (err, addresses) => {
                if (err) return res.status(500).json({ error: err.message });

                contacts[index].addresses = addresses;
                remaining--;
                if (remaining === 0) {
                    res.json(contacts);
                }
            });
        });
    });
});

app.get('/contacts/id', (req, res) => {
    const id = req.params.id;
    console.log('Requested ID:', req.params.id);

    db.query('SELECT * FROM contact WHERE id = ?', [id], (err, contactResult) => {
        if (err) return res.status(500).json({ error: err.message });
        if (contactResult.length === 0) return res.status(404).json({ error: 'Contact not found' });

        const contact = contactResult[0];

        db.query('SELECT * FROM address WHERE customer_id = ?', [id], (err, addressResult) => {
            if (err) return res.status(500).json({ error: err.message });

            contact.addresses = addressResult;
            res.json(contact);
        });
    });
});

app.post('/contacts', (req, res) => {
    const { first_name, last_name, email, phone, profile_img, addresses } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(
            'INSERT INTO contact (first_name, last_name, email, phone, profile_img) VALUES (?, ?, ?, ?, ?)',
            [first_name, last_name, email, phone, profile_img],
            (err, result) => {
                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                const contactId = result.insertId;

                if (!addresses || addresses.length === 0) {
                    return db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                        res.status(201).json({ message: 'Contact created', id: contactId });
                    });
                }

                let count = addresses.length;
                addresses.forEach((addr) => {
                    db.query(
                        'INSERT INTO address (customer_id, type, street, state, country) VALUES (?, ?, ?, ?, ?)',
                        [contactId, addr.type, addr.street, addr.state || '', addr.country],
                        (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                            count--;
                            if (count === 0) {
                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                                    res.status(201).json({ message: 'Contact and addresses created', id: contactId });
                                });
                            }
                        }
                    );
                });
            }
        );
    });
});

app.put('/contacts/id', (req, res) => {
    const id = req.params.id;
    const { first_name, last_name, email, phone, profile_img, addresses } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(
            'UPDATE contact SET first_name = ?, last_name = ?, email = ?, phone = ?, profile_img = ? WHERE id = ?',
            [first_name, last_name, email, phone, profile_img, id],
            (err) => {
                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                db.query('DELETE FROM address WHERE customer_id = ?', [id], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                    if (!addresses || addresses.length === 0) {
                        return commitAndReturnUpdatedContact(id, res);
                    }

                    let count = addresses.length;
                    addresses.forEach(addr => {
                        db.query(
                            'INSERT INTO address (customer_id, type, street, state, country) VALUES (?, ?, ?, ?, ?)',
                            [id, addr.type, addr.street, addr.state || '', addr.country],
                            (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                                count--;
                                if (count === 0) {
                                    commitAndReturnUpdatedContact(id, res);
                                }
                            }
                        );
                    });
                });
            }
        );
    });
});

function commitAndReturnUpdatedContact(id, res) {
    db.commit(err => {
        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

        db.query('SELECT * FROM contact WHERE id = ?', [id], (err, contactResult) => {
            if (err) return res.status(500).json({ error: err.message });
            if (contactResult.length === 0) return res.status(404).json({ error: 'Contact not found' });

            const contact = contactResult[0];

            db.query('SELECT * FROM address WHERE customer_id = ?', [id], (err, addressResult) => {
                if (err) return res.status(500).json({ error: err.message });

                contact.addresses = addressResult;
                res.json(contact);
            });
        });
    });
}

app.delete('/contact/:id', (req, res) => {
    const id = req.params.id;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });

        db.query('DELETE FROM address WHERE customer_id = ?', [id], (err) => {
            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

            db.query('DELETE FROM contact WHERE id = ?', [id], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                    res.json({ message: 'Contact and addresses deleted' });
                });
            });
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
