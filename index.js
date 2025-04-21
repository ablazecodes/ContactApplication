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
                    contactEl.querySelector('.delete-contact').addEventListener('click', () =>
                        deleteConfirmation(contact.id));
                    contactEl.querySelector('.edit-contact').addEventListener('click', () => openEditContactForm(contact));

                    contactList.appendChild(contactEl);
                });
            })
            .catch(error => console.error('Error loading contacts:', error));
    }

    function deleteConfirmation(id) {
        const confirmationModal = document.createElement('div');
        confirmationModal.classList.add('modal-overlay');
        confirmationModal.innerHTML = `
            <div class="confirmation-dialog">
                <p>Are you sure you want to delete this contact?</p>
                <div class="buttonDiv">
                    <button class="confirm-delete">Yes</button>
                    <button class="cancel-delete">No</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmationModal);

        confirmationModal.querySelector('.confirm-delete').addEventListener('click', () => {
            deleteContact(id);
            confirmationModal.remove();
        });

        confirmationModal.querySelector('.cancel-delete').addEventListener('click', () => {
            confirmationModal.remove();
        });
    }

    function showDetails(contact) {
        rightCol.querySelector('.contact-name').textContent = `${contact.first_name} ${contact.last_name}`;
        rightCol.querySelector('.contact-email').textContent = contact.email;
        rightCol.querySelector('.contact-phone').textContent = contact.phone;
        rightCol.querySelector('img').src = contact.profile_img || 'images/default.png';

        const address1Data = contact.addresses.find(a => a.type === 'address1');
        const address2Data = contact.addresses.find(a => a.type === 'address2');

        const address1 = rightCol.querySelector('.address-1');
        const address2 = rightCol.querySelector('.address-2');

        address1.innerHTML = `
            <p data-id="${contact.id}">
                ${address1Data ? formatAddress(address1Data) : 'No Address'}
                <button class="edit-contact"><img src="images/edit.png" alt="Edit" /></button>
            </p>
        `;

        address2.innerHTML = `
            <p data-id="${contact.id}">
                ${address2Data ? formatAddress(address2Data) : 'No Address'}
                <button class="edit-contact"><img src="images/edit.png" alt="Edit" /></button>
            </p>
        `;

        attachInlineEditHandlers(contact);
    }

    function attachInlineEditHandlers(contact) {
        const address1Btn = document.querySelector('.address-1 .edit-contact');
        const address2Btn = document.querySelector('.address-2 .edit-contact');

        address1Btn?.addEventListener('click', () => {
            const el = document.querySelector('.address-1 p');
            handleInlineEdit(el, contact, 'address1');
        });

        address2Btn?.addEventListener('click', () => {
            const el = document.querySelector('.address-2 p');
            handleInlineEdit(el, contact, 'address2');
        });
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

    function handleInlineEdit(el, contact, type) {
        //saving jo humne likha new, el = address p tag
        const existingInput = el.querySelector('input');
        const editBtn = el.querySelector('.edit-contact');
        const id = el.dataset.id;

        if (existingInput) {
            const inputs = el.querySelectorAll('input');
            const newStreet = inputs[0]?.value.trim() || '';
            const newCountry = inputs[1]?.value.trim() || '';

            el.textContent = `${newStreet}${newCountry ? ', ' + newCountry : ''}`;

            if (editBtn) {
                editBtn.innerHTML = `<img src="images/edit.png" alt="Edit">`;
                el.appendChild(editBtn);
            }

            fetch(`http://localhost:3000/contacts/${id}`)
                .then(res => res.json())
                .then(contactData => {
                    const updatedContact = {
                        ...contactData,
                        addresses: contactData.addresses.map(addr => {
                            if (addr.type === type) {
                                return { ...addr, street: newStreet, country: newCountry };
                            }
                            return addr;
                        })
                    };

                    return fetch(`http://localhost:3000/contacts/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedContact)
                    });
                })
                .then(res => res.json())
                .then(() => loadContacts())
                .catch(err => console.error('Error updating address:', err));

            return;
        }

        // Enter edit mode
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

        if (editBtn) {
            editBtn.innerHTML = `<img src="images/check.png" alt="Save">`;
            el.appendChild(editBtn);
        }

        input1.focus();

        const onBlur = () => {
            setTimeout(() => {
                if (!input1.matches(':focus') && !input2.matches(':focus')) {
                    handleInlineEdit(el, contact, type);
                }
            }, 100);
        };

        input1.addEventListener('blur', onBlur);
        input2.addEventListener('blur', onBlur);
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
                        <input type="text" id="first_name" required />
                    </div>
                    <div class="lastName-element">
                        <label for="last_name">Last Name</label>
                        <input type="text" id="last_name" required />
                    </div>
                    <div class="email-element">
                        <label for="email">Email</label>
                        <input type="email" id="email" required />
                    </div>
                    <div class="phone-element">
                        <label for="phone">Phone Number</label>
                        <input type="tel" id="phone" required />
                    </div>
                    <div class="profile-element">
                        <label for="profile_img">Profile Image URL</label>
                        <input type="text" id="profile_img" />
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
                    <div class="buttonDiv">
                        <button type="button" class="close-button">Cancel</button>
                        <button type="submit" id="submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.querySelectorAll('.close-button').forEach(btn =>
            btn.addEventListener('click', () =>
                document.querySelector('.modal-overlay')?.remove()
            )
        );

        document.getElementById('create-contact-form')
            .addEventListener('submit', handleCreateContact);
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
                    country: document.getElementById('address1Country').value || 'No country'
                },
                {
                    type: 'address2',
                    street: document.getElementById('address2Street').value || 'No street',
                    state: '',
                    country: document.getElementById('address2Country').value || 'No country'
                }
            ]
        };

        const email = newContact.email.trim();
        const phone = newContact.phone.trim();
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
                        <div class="buttonDiv">
                            <button type="button" class="close-button">Cancel</button>
                            <button type="submit" id="submit">Save</button>
                        </div>
                    </form>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.querySelectorAll('.close-button').forEach(btn =>
            btn.addEventListener('click', () =>
                document.querySelector('.modal-overlay')?.remove()
            )
        );

        document.getElementById('create-contact-form')
            .addEventListener('submit', (e) => handleEditContact(e, contact));
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

        const email = updatedContact.email.trim();
        const phone = updatedContact.phone.trim();
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

        fetch(`http://localhost:3000/contacts/${contact.id}`, {
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