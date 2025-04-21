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

app.get('/contacts/:id', (req, res) => {
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
                if(count>0)
                {
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
            }
        );
    });
});

app.put('/contacts/:id', (req, res) => {
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// function handleInlineEdit(el) {
//     const existingInput = el.querySelector('input');
//     const editBtn = el.querySelector('.edit-contact');

//     if (existingInput) {
//         const newStreet = el.querySelector('input:nth-of-type(1)').value.trim();
//         const newCountry = el.querySelector('input:nth-of-type(2)').value.trim();
//         const id = el.dataset.id;

//         el.textContent = (newStreet || '') + (newCountry ? ', ' + newCountry : '');

//         if (editBtn) {
//             editBtn.innerHTML = `<img src="images/edit.png" alt="Edit">`;
//             el.appendChild(editBtn);
//         }

//        fetch(`http://localhost:3000/contacts/${id}`)
//             .then(res => res.json())
//             .then(contact => {
//                 const updatedContact = {
//                     ...contact,
//                     addresses: contact.addresses.map((address, index) => ({
//                         ...address,
//                         street: newStreet,
//                         country: newCountry
//                     }))
//                 };

//                 return fetch(`http://localhost:3000/contacts/${id}`, {
//                     method: 'PUT',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify(updatedContact),
//                 });
//             })
//             .then(res => res.json())
//             .then(() => loadContacts())
//             .catch(err => console.error('Error updating address:', err));

//         return;
//     }

//     const currentText = el.textContent.trim();
//     const [currentStreet, currentCountry] = currentText.split(',').map(t => t.trim());

//     const input1 = document.createElement('input');
//     const input2 = document.createElement('input');
//     input1.type = 'text';
//     input2.type = 'text';
//     input1.value = currentStreet || '';
//     input2.value = currentCountry || '';

//     el.innerHTML = '';
//     el.appendChild(input1);
//     el.appendChild(input2);

//     if (editBtn) {
//         editBtn.innerHTML = `<img src="images/check.png" alt="Save">`;
//         el.appendChild(editBtn);
//     }

//     input1.focus();

//     const finalizeEdit = () => {
//         const newStreet = input1.value.trim();
//         const newCountry = input2.value.trim();
//         el.textContent = (newStreet || '') + (newCountry ? ', ' + newCountry : '');

//         if (editBtn) {
//             editBtn.innerHTML = `<img src="images/edit.png" alt="Edit">`;
//             el.appendChild(editBtn);
//         }

//         const id = el.dataset.id;
//         fetch(`http://localhost:3000/contacts/${id}`)
//             .then(res => res.json())
//             .then(contact => {
//                 const updatedContact = {
//                     ...contact,
//                     addresses: contact.addresses.map((address) => ({
//                         ...address,
//                         street: newStreet,
//                         country: newCountry
//                     }))
//                 };

//                 return fetch(`http://localhost:3000/contacts/${id}`, {
//                     method: 'PUT',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify(updatedContact),
//                 });
//             })
//             .then(res => res.json())
//             .then(() => loadContacts())
//             .catch(err => console.error('Error updating address:', err));
//     };

//     const onBlur = () => {
//         setTimeout(() => {
//             if (!input1.matches(':focus') && !input2.matches(':focus')) {
//                 finalizeEdit();
//             }
//         }, 100);
//     };

//     input1.addEventListener('blur', onBlur);
//     input2.addEventListener('blur', onBlur);
// }

