document.addEventListener('DOMContentLoaded', () => {
    const rightCol = document.querySelector('.right-col .contact-deets');
    const searchInput = document.querySelector('.left-col input');
    const headerButton = document.querySelector('.header-button');
    const contactList = document.querySelector('.contact-list');

    function loadContacts() {
        fetch('http://localhost:3000/contacts')
            .then(res => res.json())
            .then(data => {
                contactList.innerHTML = '';
                data.forEach(contact => {
                    const contactEl = document.createElement('div');
                    contactEl.classList.add('contact');
                    contactEl.innerHTML = `
                        <div class="left">
                            <h3 class="contact-name">${contact.first_name} ${contact.last_name}</h3>
                        </div>
                        <div class="contact-action-buttons">
                            <button class="delete-contact"><img src="images/delete.png" alt="Delete"></button>
                            <button class="edit-contact"><img src="images/edit.png" alt="Edit"></button>
                        </div>
                    `;
                    contactEl.querySelector('.contact-name').addEventListener('click', () => showDetails(contact));
                    contactEl.querySelector('.delete-contact').addEventListener('click', () => deleteContact(contact.id));
                    contactEl.querySelector('.edit-contact').addEventListener('click', () => openEditContactForm(contact));
                    contactList.appendChild(contactEl);
                });
            })
            .catch(error => console.error('Error loading contacts:', error));
    }

    function showDetails(contact) {
        rightCol.querySelector('.contact-name').textContent = `${contact.first_name} ${contact.last_name}`;
        rightCol.querySelector('.contact-email').textContent = contact.email;
        rightCol.querySelector('.contact-phone').textContent = contact.phone;
        rightCol.querySelector('img').src = contact.profile_img || 'images/person1.jpg';

        const address1Data = contact.addresses.find(a => a.type === 'address1');
        const address2Data = contact.addresses.find(a => a.type === 'address2');

        const address1 = rightCol.querySelector('.address-1');
        const address2 = rightCol.querySelector('.address-2');

        address1.innerHTML = `
            <p>
                ${address1Data ? formatAddress(address1Data) : 'No Address'}
                <button class="edit-contact">
                    <img src="images/edit.png" alt="Edit" />
                </button>
            </p>
        `;

        address2.innerHTML = `
            <p>
                ${address2Data ? formatAddress(address2Data) : 'No Address'}
                <button class="edit-contact">
                    <img src="images/edit.png" alt="Edit" />
                </button>
            </p>
        `;

        document.querySelectorAll('.edit-address-btn').forEach(btn => {
            const type = btn.dataset.type;
            btn.addEventListener('click', () => {
                const container = type === 'address1' ? address1 : address2;
                handleInlineEdit(container, contact, type);
            });
        });

        attachInlineEditHandlers();
    }

    function formatAddress(addr) {
        return `${addr.street}, ${addr.country}`;
    }

    function deleteContact(id) {
        fetch(`http://localhost:3000/contact/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(() => loadContacts())
            .catch(error => console.error('Error deleting contact:', error));
    }

    function attachInlineEditHandlers() {
        const address1Btn = document.querySelector('.address-1 .edit-contact');
        const address2Btn = document.querySelector('.address-2 .edit-contact');

        address1Btn?.addEventListener('click', () => {
            const el = document.querySelector('.address-1 p');
            handleInlineEdit(el);
        });

        address2Btn?.addEventListener('click', () => {
            const el = document.querySelector('.address-2 p');
            handleInlineEdit(el);
        });
    }

    function handleInlineEdit(el) {
        const existingInput = el.querySelector('input');
        const editBtn = el.querySelector('.edit-contact');
    
        if (existingInput) {
            const newStreet = el.querySelector('input:nth-child(1)').value.trim();
            const newCountry = el.querySelector('input:nth-child(2)').value.trim();
    
            el.textContent = (newStreet || '') + (newCountry ? ', ' + newCountry : '');
    
            if (editBtn) {
                el.appendChild(editBtn);
            }
            return;
        }
    
        const currentText = el.textContent.trim();
        const [currentStreet, currentCountry] = currentText.split(',').map(t => t.trim());
    
        const input1 = document.createElement('input');
        const input2 = document.createElement('input');
        input1.type = 'text';
        input2.type = 'text';
        input1.value = currentStreet || '';
        input2.value = currentCountry || '';
    
        el.innerHTML = '';
        el.appendChild(input1);
        el.appendChild(input2);
        if (editBtn) el.appendChild(editBtn);
    
        input1.focus();
    
        const finalizeEdit = () => {
            const newStreet = input1.value.trim();
            const newCountry = input2.value.trim();
            el.textContent = (newStreet || '') + (newCountry ? ', ' + newCountry : '');
            if (editBtn) el.appendChild(editBtn);
        };
    
        input1.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finalizeEdit();
            }
        });
    
        input2.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finalizeEdit();
            }
        });
    
        input1.addEventListener('blur', () => {
            if (!el.contains(document.activeElement)) {
                finalizeEdit();
            }
        });
    
        input2.addEventListener('blur', () => {
            if (!el.contains(document.activeElement)) {
                finalizeEdit();
            }
        });

    }
    
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase();
        document.querySelectorAll('.contact').forEach(contact => {
            const name = contact.querySelector('.contact-name').textContent.toLowerCase();
            contact.style.display = name.includes(term) ? 'flex' : 'none';
        });
    });

    headerButton.addEventListener('click', openCreateContactForm);

    function openCreateContactForm() {
        const modalHTML = `
        <div class="modal-overlay">
            <div class="create-contact">
                <h2>Create New Contact</h2>
                <form id="create-contact-form">
                    <div class="firstName-element">
                        <label for="first_name">First Name</label>
                        <input type="text" id="first_name" placeholder="First Name" required />
                    </div>
                    <div class="lastName-element">
                        <label for="last_name">Last Name</label>
                        <input type="text" id="last_name" placeholder="Last Name" required />
                    </div>
                    <div class="email-element">
                        <label for="email">Email</label>
                        <input type="email" id="email" placeholder="Email" required />
                    </div>
                    <div class="phone-element">
                        <label for="phone">Phone Number</label>
                        <input type="tel" id="phone" placeholder="Phone Number" required />
                    </div>
                    <div class="profile-element">
                        <label for="profile_img">Profile Image URL</label>
                        <input type="text" id="profile_img" placeholder="Profile Image URL" />
                    </div>
                    <div class="address1-element">
                        <label for="address1">Address 1</label>
                        <input type="text" id="address1Street" placeholder="Street" />
                        <input type="text" id="address1Country" placeholder="Country" />
                    </div>
                    <div class="address2-element">
                        <label for="address2">Address 2</label>
                        <input type="text" id="address2Street" placeholder="Street" />
                        <input type="text" id="address2Country" placeholder="Country" />
                    </div>
                    <button type="submit" id="submit">Submit</button>
                    <button type="button" class="close-button">Cancel</button>
                </form>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const closeBtn = document.querySelectorAll('.close-button');
        closeBtn.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.modal-overlay')?.remove();
            });
        });

        const form = document.getElementById('create-contact-form');
        form.addEventListener('submit', handleCreateContact);
    }

    function openEditContactForm(contact) {
        const address1 = contact.addresses.find(a => a.type === 'address1') || {};
        const address2 = contact.addresses.find(a => a.type === 'address2') || {};
    
        const modalHTML = `
            <div class="modal-overlay">
                <div class="create-contact">
                    <h2>Edit Contact</h2>
                    <form id="create-contact-form">
                        <div class="firstName-element">
                            <label for="first_name">First Name</label>
                            <input type="text" id="first_name" value="${contact.first_name}" required />
                        </div>
                        <div class="lastName-element">
                            <label for="last_name">Last Name</label>
                            <input type="text" id="last_name" value="${contact.last_name}" required />
                        </div>
                        <div class="email-element">
                            <label for="email">Email</label>
                            <input type="email" id="email" value="${contact.email}" required />
                        </div>
                        <div class="phone-element">
                            <label for="phone">Phone Number</label>
                            <input type="tel" id="phone" value="${contact.phone}" required />
                        </div>
                        <div class="profile-element">
                            <label for="profile_img">Profile Image URL</label>
                            <input type="text" id="profile_img" value="${contact.profile_img}" />
                        </div>
                        <div class="address1-element">
                            <label for="address1">Address 1</label>
                            <input type="text" id="address1Street" value="${address1.street || ''}" />
                            <input type="text" id="address1Country" value="${address1.country || ''}" />
                        </div>
                        <div class="address2-element">
                            <label for="address2">Address 2</label>
                            <input type="text" id="address2Street" value="${address2.street || ''}" />
                            <input type="text" id="address2Country" value="${address2.country || ''}" />
                        </div>
                        <button type="submit" id="submit">Save Changes</button>
                        <button type="button" class="close-button">Cancel</button>
                    </form>
                </div>
            </div>`;
    
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    
        const closeBtn = document.querySelectorAll('.close-button');
        closeBtn.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.modal-overlay')?.remove();
            });
        });
    
        const form = document.getElementById('create-contact-form');
        form.addEventListener('submit', (e) => handleEditContact(e, contact));
    }
    

    function handleCreateContact(e) {
        e.preventDefault();

        const newContact = {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            profile_img: document.getElementById('profile_img').value,
            addresses: [
                {
                    type: 'address1',
                    street: document.getElementById('address1Street').value || 'No street',
                    state: '',
                    country: document.getElementById('address1Country').value || 'No Country'
                },
                {
                    type: 'address2',
                    street: document.getElementById('address2Street').value || 'No street',
                    state: '',
                    country: document.getElementById('address2Country').value || 'No country'
                }
            ]
        };

        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[0-9]{10,15}$/;

        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        if (!phoneRegex.test(phone)) {
            alert('Please enter a valid phone number (at least 10 digits).');
            return;
        }
        console.log(JSON.stringify(newContact));

        fetch('http://localhost:3000/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newContact),
        })
        .then(res => res.json())
        .then(() => {
            loadContacts();
            document.querySelector('.modal-overlay')?.remove();
        })
        .catch(err => console.error('Error creating contact:', err));
    }

    function handleEditContact(e, contact) {
        e.preventDefault();

        const updatedContact = {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            profile_img: document.getElementById('profile_img').value,
            addresses: [
                {
                    type: 'address1',
                    street: document.getElementById('address1Street').value,
                    state: '',
                    country: document.getElementById('address1Country').value
                },
                {
                    type: 'address2',
                    street: document.getElementById('address2Street').value,
                    state: '',
                    country: document.getElementById('address2Country').value
                }
            ]
        };

        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[0-9]{10,15}$/;

        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        if (!phoneRegex.test(phone)) {
            alert('Please enter a valid phone number (at least 7 digits).');
            return;
        }

        fetch(`http://localhost:3000/contact/${contact.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedContact),
        })
        .then(res => res.json())
        .then(() => {
            loadContacts();
            document.querySelector('.modal-overlay')?.remove();
        })
        .catch(err => console.error('Error editing contact:', err));
    }

    loadContacts();
});
