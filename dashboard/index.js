const loginpPage = document.querySelector('.loginPage')
const registerPage = document.querySelector('.registerPage')
const mainContent = document.querySelector('.mainContent')

const closeIcons = document.querySelectorAll('.closeIcon')
function moveHome(){
    registerPage.style.display = 'none';
    loginpPage.style.display = 'none';
    mainContent.style.display = 'block';
    
}
closeIcons.forEach(closeIcon => closeIcon.addEventListener('click', moveHome))




const loginBtns = document.querySelectorAll('.login_Btn')
const registerBtns = document.querySelectorAll('.register_Btn')

loginBtns.forEach(loginBtn => {
    loginBtn.addEventListener('click', function(){
        mainContent.style.display =  'none';
        registerPage.style.display = 'none'
        loginpPage.style.display = 'flex';
    })
})

registerBtns.forEach(registerBtn => {
    registerBtn.addEventListener('click', function(){
        mainContent.style.display =  'none';
        loginpPage.style.display = 'none';
        registerPage.style.display = 'flex';
    })
})
//Create an Event

let createEvent = document.querySelector('.addBtn');
let createPortal = document.querySelector('.portalContainer');

createEvent.addEventListener('click', function(){
    createPortal.style.opacity = 1;
})

function toggleTicketTypeInputs() {
    const ticketTypeInputs = document.getElementById('ticketTypeInputs');
    const checkbox = document.getElementById('ticketTypeCheckbox');
    var numTicketTypesInput = document.getElementById("numTicketTypes");
    
    if (checkbox.checked) {
        ticketTypeInputs.style.display = 'flex';
        numTicketTypesInput.disabled = false;
    } else {
        ticketTypeInputs.style.display = 'flex';
        numTicketTypesInput.disabled = true;
        createTicketTypeInputs(1); // Set default to 1 ticket type
    }
}

function createTicketTypeInputs(numTicketTypes) {
    const ticketTypeInputsContainer = document.getElementById('ticketTypeInputs');
    ticketTypeInputsContainer.innerHTML = ''; // Clear previous inputs

    for (let i = 1; i <= numTicketTypes; i++) {
        const nameLabel = document.createElement('label');
        nameLabel.setAttribute('for', `ticketTypeName${i}`);
        nameLabel.innerText = `Ticket Type ${i} Name:`;

        const nameInput = document.createElement('input');
        nameInput.setAttribute('type', 'text');
        nameInput.setAttribute('id', `ticketTypeName${i}`);
        nameInput.setAttribute('placeholder', `Enter name for Ticket Type ${i}`);

        const priceLabel = document.createElement('label');
        priceLabel.setAttribute('for', `ticketTypePrice${i}`);
        priceLabel.innerText = `Ticket Type ${i} Price:`;

        const priceInput = document.createElement('input');
        priceInput.setAttribute('type', 'text');
        priceInput.setAttribute('id', `ticketTypePrice${i}`);
        priceInput.setAttribute('placeholder', `Enter price for Ticket Type ${i}`);

        const quantityLabel = document.createElement('label');
        quantityLabel.setAttribute('for', `ticketTypeQuantity${i}`);
        quantityLabel.innerText = `Ticket Type ${i} Quantity:`;

        const quantityInput = document.createElement('input');
        quantityInput.setAttribute('type', 'number');
        quantityInput.setAttribute('id', `ticketTypeQuantity${i}`);
        quantityInput.setAttribute('placeholder', `Enter quantity for Ticket Type ${i}`);
        quantityInput.setAttribute('min', '0');

        ticketTypeInputsContainer.appendChild(nameLabel);
        ticketTypeInputsContainer.appendChild(nameInput);
        ticketTypeInputsContainer.appendChild(priceLabel);
        ticketTypeInputsContainer.appendChild(priceInput);
        ticketTypeInputsContainer.appendChild(quantityLabel);
        ticketTypeInputsContainer.appendChild(quantityInput);
    }
}




