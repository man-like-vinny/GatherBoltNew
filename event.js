const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');

menu.addEventListener('click', function() {
  menu.classList.toggle('is-active');
  menuLinks.classList.toggle('active');
});

let iconCart = document.querySelector('.iconCart');
let clearCartButton = document.querySelector('.clear-cart-button');
let checkoutButton = document.querySelector('.checkout')
let cart = document.querySelector('.cart');
let container = document.querySelector('.navbar');
let event_container = document.querySelector('.listProduct');
let close = document.querySelector('.close');

//food selections
let chickenMealCount = 0;
let vegMealCount = 0;

//promotions
let marginValue = 0; // Initial margin value
let initialListCartLength = 0; // Initial length of listCart
let promoClass = document.querySelector('.cart .promotions');
let promoHeader = document.querySelector('.cart .promotions .promotionsHeader');
let promoField = document.querySelector('.cart .promotions .promotionCheckout');
let promoStatus = document.querySelector('.cart .promotions .promotionStatus');
let promoTextBar = document.getElementById('promotionForm');
let promoApplyButton = document.querySelector('form button');

let promoTag = document.querySelector('.cart .promotions .promotionTag');
let promoTagName = document.querySelector('.cart .promotions .promotionTag .promotionTagName');
let promoTagCancel = document.querySelector('.cart .promotions .promotionTag .promotionTagCancel');

const originalTopValue = getComputedStyle(promoClass).top;

promoHeader.addEventListener('click', function(){
    promoField.style.display = 'flex';
    promoHeader.style.cursor = 'auto';
    promoHeader.style.color = 'grey';
})

promoTagCancel.addEventListener('click', function() {
    deleteAllPromo();
    promoTag.classList.remove('show');
    //promoTag.style.display = 'none';

    promoStatus.style.display = 'none';

    promoApplyButton.style.color = '';
    promoApplyButton.style.pointerEvents = '';
    
    document.getElementById('name').disabled = false;
})

function setPromoHeaderDefault() {

    //promoHeader.style.opacity = 1; 
    //promoField.style.opacity = 0;

    promoHeader.style.cursor = 'pointer';
    promoHeader.style.color = 'rgb(29, 101, 193)';
    promoHeader.style.display = 'block';

    promoStatus.style.opacity = 0;

    promoField.style.display = 'none';

    marginValue -= 80; // Increment the margin by 20px each time
    promoHeader.style.marginTop = `${marginValue}px`;

    
    promoApplyButton.style.color = '';
    promoApplyButton.style.pointerEvents = '';

    document.getElementById('name').disabled = false;
}

promoTextBar.addEventListener('submit', function (event) {
    // Prevent the default form submission
    event.preventDefault();

    var submittedValue = document.getElementById('name').value;

    checkPromo(submittedValue);

    reset();
});

iconCart.addEventListener('click', function(){
    if(cart.style.right == '-100%'){
        cart.style.right = '0';
        container.style.transform = 'translateX(-400px)';
        event_container.style.transform = 'translateX(-150px)';
    }else{
        cart.style.right = '-100%';
        container.style.transform = 'translateX(0)';
        event_container.style.transform = 'translateX(0)';
    }
})

close.addEventListener('click', function (){
    cart.style.right = '-100%';
    container.style.transform = 'translateX(0)';
    event_container.style.transform = 'translateX(0)';
})

clearCartButton.addEventListener('click', function() {
    clearCart();
});

let products = null;
// get data from file json
fetch('/getProducts')
    .then(response => response.json())
    .then(data => {
        products = data;
        addDataToHTML();
})

let promotions = null;
fetch('/getPromo')
    .then(response => response.json())
    .then(data => {
        promotions = data;
})

let seats = null;
const eventId = "YSM2025"; // Replace with actual event ID

fetch(`/getSeats/${eventId}`)  // ✅ Uses path parameter correctly
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        seats = data;
    })
    .catch(error => console.error('Error fetching seats:', error));


let listCart = [];

checkoutButton.addEventListener('click', async function(){
    if (listCart.every(element => element === null) || listCart.length === 0) {
        window.alert("Cart Empty!")
        return;
    }

    const itemsWithSeats = listCart.filter(item => item && item.selectedSeats && item.selectedSeats.length > 0);
    
    if (itemsWithSeats.length > 0) {
        for (const item of itemsWithSeats) {
            // Create a new WebSocket connection
            const ws = new WebSocket(host);
            
            // Wait for the connection to be established
            await new Promise((resolve) => {
                ws.onopen = () => resolve();
            });

            // Update each seat status
            for (const seatNumber of item.selectedSeats) {
                // Update seat in database
                await fetch('/updateSeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        eventId: item.id,
                        seatNumber,
                        status: 'unavailable'
                    })
                });

                // Broadcast the update
                ws.send(JSON.stringify({
                    action: 'checkoutCompleted',
                    seats: [{
                        eventId: item.id,
                        seatNumber,
                        status: 'unavailable'
                    }]
                }));
            }

            // Close the WebSocket connection
            ws.close();
        }
    }

    window.location.href = '/checkout.html';
});



checkoutButton.addEventListener('mouseover', function() {
    if (listCart.every(element => element === null) || listCart.length === 0) {
        checkoutButton.style.backgroundColor = 'red';
    } else {
        checkoutButton.style.backgroundColor = 'green'; // Change to green if listCart is not empty
    }
});

checkoutButton.addEventListener('mouseout', function() {
    checkoutButton.style.backgroundColor = 'rgb(29, 101, 193)'
});

//----seat stuff-----
let seatMap = null;

class SeatMap {
  constructor(containerId, eventId, quantity) {
    this.container = document.getElementById(containerId);
    this.eventId = eventId;
    this.quantity = quantity;
    this.selectedSeats = new Set();
    this.seatData = null;
    this.ws = null;
  }

  async init() {
    await this.fetchSeats();
    this.render();
    this.initWebSocket();
  }

  initWebSocket() {
    this.ws = new WebSocket(host);
    this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'seatUpdated') {
            this.updateSeatStatus(data.seat);
        } else if (data.action === 'checkoutCompleted') {
            this.markSeatsAsUnavailable(data.seats);
        }
    };
  }

  async fetchSeats() {
    const response = await fetch(`/getSeats/${this.eventId}`);
    this.seatData = await response.json();
  }

    markSeatsAsUnavailable(seats) {
        seats.forEach(seatInfo => {
            this.updateSeatStatus(seatInfo);
        });
    }

  updateSeatStatus(seatInfo) {
    const seatElement = this.container.querySelector(`[data-seat="${seatInfo.seatNumber}"]`);
    if (seatElement) {
        seatElement.className = `seat ${seatInfo.status}`;
        
        // If the seat becomes unavailable, remove it from selected seats
        if (seatInfo.status === 'unavailable' && this.selectedSeats.has(seatInfo.seatNumber)) {
            this.selectedSeats.delete(seatInfo.seatNumber);
            this.updateSelectedSeatsText();
        }
    }
}

  updateSelectedSeatsText() {
    const selectedSeatsText = document.getElementById('selected-seats-text');
    if (selectedSeatsText) {
        if (this.selectedSeats.size > 0) {
            const seatsArray = Array.from(this.selectedSeats);
            selectedSeatsText.textContent = `Selected Seat${this.selectedSeats.size > 1 ? 's' : ''}: ${seatsArray.join(', ')}`;
        } else {
            selectedSeatsText.textContent = 'No seats selected';
        }
    }
  }

  render() {
    const modal = document.createElement('div');
    modal.className = 'seat-selection-modal active';
    
    const mapContainer = document.createElement('div');
    mapContainer.className = 'seat-map-container';

    const seatMap = document.createElement('div');
    seatMap.className = 'seat-map';

    // Add stage area
    const stage = document.createElement('div');
    stage.className = 'stage-area';
    stage.innerHTML = '<div class="stage-label">STAGE</div>';
    seatMap.appendChild(stage);       
    
    // Add selected seats text display
    const selectedSeatsText = document.createElement('div');
    selectedSeatsText.id = 'selected-seats-text';
    selectedSeatsText.className = 'selected-seats-text';
    selectedSeatsText.textContent = 'No seats selected';
    seatMap.appendChild(selectedSeatsText);

    // Add legend
    const legend = document.createElement('div');
    legend.className = 'seat-legend';
    legend.innerHTML = `
      <div class="legend-item">
        <div class="seat available"></div>
        <span>Available</span>
      </div>
      <div class="legend-item">
        <div class="seat selected"></div>
        <span>Selected</span>
      </div>
      <div class="legend-item">
        <div class="seat unavailable"></div>
        <span>Unavailable</span>
      </div>
      <div class="legend-item">
        <div class="seat in-cart"></div>
        <span>In Cart</span>
      </div>
    `;
    seatMap.appendChild(legend);

    // Create seat grid
    const grid = document.createElement('div');
    grid.className = 'seat-grid';

    const rows = ['A', 'B', 'C'];

    rows.forEach(row => {
    const rowElement = document.createElement('div');
    rowElement.className = 'seat-row';
    
    const label = document.createElement('div');
    label.className = 'row-label';
    label.textContent = row;
    rowElement.appendChild(label);

    // Determine the number of columns based on row
    const totalSeats = row === 'A' ? 18 : 18;

    for (let col = 1; col <= totalSeats; col++) {
        // Skip seats A17 and A18
        if (row === 'A' && col > 16) continue;
        
        const seat = document.createElement('div');
        const seatNumber = `${row}${col}`;
        seat.className = 'seat available';
        seat.dataset.seat = seatNumber;
        
        // Check if seat exists in seatData and update its status
        //const seatData = this.seatData?.find(s => s.seatNumber === seatNumber);
        const seatData = seats?.find(seat => seat.seatNumber === seatNumber);
        if (seatData) {
        seat.className = `seat ${seatData.status}`;
        }

        // Check if seat is in cart
        if (listCart && listCart.some(item => item?.selectedSeats?.includes(seatNumber))) {
        seat.className = 'seat in-cart';
        }

        seat.addEventListener('click', () => this.handleSeatClick(seat, seatNumber));
        rowElement.appendChild(seat);
    }
    
    if (row === 'A') {
        // Add placeholders for missing seats on the right
        for (let i = 1; i <= 2; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'seat placeholder';
        rowElement.appendChild(placeholder);
        }
    }

    grid.appendChild(rowElement);
    });
    

    seatMap.appendChild(grid);

    // Add action buttons
    const actions = document.createElement('div');
    actions.className = 'seat-actions';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'confirm-seats';
    confirmBtn.textContent = 'Confirm Selection';
    confirmBtn.addEventListener('click', () => this.confirmSelection());
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-selection';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close());
    
    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
    seatMap.appendChild(actions);

    mapContainer.appendChild(seatMap);
    modal.appendChild(mapContainer);
    this.container.appendChild(modal);
  }

  handleSeatClick(seatElement, seatNumber) {
    if (seatElement.classList.contains('unavailable') || 
        seatElement.classList.contains('in-cart')) {
      return;
    }

    if (this.selectedSeats.has(seatNumber)) {
      seatElement.classList.remove('selected');
      this.selectedSeats.delete(seatNumber);
    } else {
      if (this.selectedSeats.size >= this.quantity) {
        alert(`You can only select ${this.quantity} seats`);
        return;
      }
      seatElement.classList.add('selected');
      this.selectedSeats.add(seatNumber);
    }

    this.updateSelectedSeatsText();

  }

  async confirmSelection() {
    if (this.selectedSeats.size === 0) {
        alert('Please select your seats');
        return;
    }

    if (this.selectedSeats.size !== this.quantity) {
        alert(`Please select exactly ${this.quantity} seats`);
        return;
    }

    const foodSelect = document.getElementById(`food-option-1`);
    if (!foodSelect || !foodSelect.value) {
        alert('Please select a food preference');
        return;
    }

    const foodSelection = foodSelect.value;  // Get selected food value
    const foodArray = [];  // Initialize an array if not already created

   // Verify seats are still available
   const response = await fetch('/verifySeats', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        eventId: this.eventId,
        seats: Array.from(this.selectedSeats)
        })
    });

    const result = await response.json();

    if (!result.available) {
        alert("Some selected seats are no longer available. Please choose different seats.");
        // Refresh the seat map
        await this.fetchSeats();
        this.selectedSeats.clear();
        this.container.innerHTML = '';
        this.render();
        return;
    }

    // Update seats in database
    const seats = Array.from(this.selectedSeats);
    for (const seatNumber of seats) {
        await fetch('/updateSeat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId: this.eventId,
                seatNumber,
                status: 'in_cart'
            })
        });
    }

    // If the product is already in cart, append the new seats
    if (listCart[this.eventId]) {
        if (!listCart[this.eventId].selectedSeats) {
            listCart[this.eventId].selectedSeats = [];
        }
        listCart[this.eventId].selectedSeats.push(...seats);
        //listCart[this.eventId].quantity++;
        //listCart[this.eventId].ticketQuantity--;
        foodArray.push(foodSelection);  // Add food selection to array
        addCart(this.eventId, this.ticketType, seats, foodArray);
    } else {
        // Add to cart with selected seats
        foodArray.push(foodSelection);  // Add food selection to array
        addCart(this.eventId, this.ticketType, seats, foodArray);
    }

    this.close();
    }
    
    async completeCheckout() {

        const seats = Array.from(this.selectedSeats);

        for (const seatNumber of seats) {
            await fetch('/updateSeat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eventId: this.eventId,
                    seatNumber,
                    status: 'unavailable'
                })
            });
        }
    
        // Notify all clients that these seats are now unavailable
        this.ws.send(JSON.stringify({
            action: 'checkoutCompleted',
            seats: seats.map(seatNumber => ({
                eventId: this.eventId,
                seatNumber,
                status: 'unavailable'
            }))
        }));
        
        //delete listCart[this.eventId];
        alert("Checkout successful! Your seats are now unavailable.");
    }
    

  close() {
    this.container.innerHTML = '';
    seatMap = null;
  }
}


//---------websocket---------------
var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);

ws.addEventListener('open', () => {
  console.log('WebSocket connection is open.');
  // You can now use this WebSocket connection for real-time communication.
  // For example, you can listen for messages from the server and send messages.
});

ws.addEventListener('ping', () => {
    // When a ping message is received from the server, respond with a pong
    ws.pong();
    console.log('Sent a ping from the client.');
  });

ws.addEventListener('close', (event) => {
  if (event.wasClean) {
    console.log(`WebSocket connection closed cleanly, code: ${event.code}, reason: ${event.reason}`);
  } else {
    console.error('WebSocket connection abruptly closed');
  }
});

ws.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
});

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.action === 'numberOfClients') {
      // Handle the number of connected clients
      const numberOfClients = data.count;
      console.log(`Number of connected clients: ${numberOfClients}`);
    } else if (data.action === 'seatUpdated' || data.action === 'checkoutCompleted') {
        if (seatMap) {
            if (data.action === 'seatUpdated') {
                seatMap.updateSeatStatus(data.seat);
            } else {
                seatMap.markSeatsAsUnavailable(data.seats);
            }
        } else {
            // If seatMap doesn't exist, update the seat display directly
            data.seats?.forEach(seatInfo => {
                const seatElement = document.querySelector(`[data-seat="${seatInfo.seatNumber}"]`);
                if (seatElement) {
                    seatElement.className = `seat ${seatInfo.status}`;
                }
            });
        }
    }
});


let selectedTicketType = null;

// // Function to save the selected ticket type
function saveSelectedTicketType() {
    // Get the select element
    const ticketTypeSelect = document.getElementById("ticketType");

    // Get the selected value (either "earlyBird" or "standard")
    selectedTicketType = ticketTypeSelect.value;

    // Display the selected ticket type
    const selectedTicketElement = document.getElementById("selectedTicket");
    selectedTicketElement.textContent = selectedTicketType;
}


function addDataToHTML() {
    // remove datas default from HTML
    let listProductHTML = document.querySelector('.listEvents');
    listProductHTML.innerHTML = '';

    const selectedProduct = products.find(product => product.name == currentFileName);
    const ProductPriceOptionOne = selectedProduct.type.find(type => type.ticketType === selectedProduct.option1);
    const ProductPriceOptionTwo = selectedProduct.type.find(type => type.ticketType === selectedProduct.option2);
    const ProductPriceOptionThree = selectedProduct.type.find(type => type.ticketType === selectedProduct.option3);
    const ProductPriceOptionFour = selectedProduct.type.find(type => type.ticketType === selectedProduct.option4);
    const ProductPriceOptionFive = selectedProduct.type.find(type => type.ticketType === selectedProduct.option5);

    if(ProductPriceOptionOne){
        if(ProductPriceOptionOne.ticketQuantity == 0)
        {
            ProductPriceOptionOne.productAvailability = "Sold Out";
        }
        else{
            ProductPriceOptionOne.productAvailability = "Available";
        }
    }

    if(ProductPriceOptionTwo){
        if(ProductPriceOptionTwo.ticketQuantity == 0)
        {
            ProductPriceOptionTwo.productAvailability = "Sold Out";
        }
        else
        {
            ProductPriceOptionTwo.productAvailability = "Available";
        }
    }

    if(ProductPriceOptionThree){
        if(ProductPriceOptionThree.ticketQuantity == 0)
        {
            ProductPriceOptionThree.productAvailability = "Sold Out";
        }
        else
        {
            ProductPriceOptionThree.productAvailability = "Available";
        }
    }

    if(ProductPriceOptionFour){
        if(ProductPriceOptionFour.ticketQuantity == 0)
        {
            ProductPriceOptionFour.productAvailability = "Sold Out";
        }
        else
        {
            ProductPriceOptionFour.productAvailability = "Available";
        }
    }

    if(ProductPriceOptionFive){
        if(ProductPriceOptionFive.ticketQuantity == 0)
        {
            ProductPriceOptionFive.productAvailability = "Sold Out";
        }
        else
        {
            ProductPriceOptionFive.productAvailability = "Available";
        }
    }

        if(selectedProduct) {
            let newProduct = document.createElement('div');
            newProduct.classList.add('item');
            
            // Create a container for the background effect
            // let backgroundEffect = document.createElement('div');
            // backgroundEffect.classList.add('item-bg');
            // backgroundEffect.style.backgroundImage = `url(${selectedProduct.image})`;

            // newProduct.appendChild(backgroundEffect);

            let backgroundEffect = document.createElement('div');
            backgroundEffect.classList.add('item-bg');
        
            // Create an image element
            let backgroundImage = new Image();
            backgroundImage.src = selectedProduct.landscapeimage;
        
            // Wait for the image to load 
            backgroundImage.onload = function () {
                // Set the background image after it has loaded
                backgroundEffect.style.backgroundImage = `url(${selectedProduct.landscapeimage})`;
        
                // Check if the image is portrait or landscape
                const isPortrait = backgroundImage.height > backgroundImage.width;
        
                // Add the appropriate class to adjust height dynamically
                newProduct.classList.add(isPortrait ? 'portrait' : 'landscape');

                if(!isPortrait && window.innerWidth <= 960){
                    const servicesElement = document.querySelector('.services');
                    if(servicesElement){
                        servicesElement.style.height = '950px';
                        servicesElement.style.paddingBottom = '450px';
                    }
                }
            };
        
            newProduct.appendChild(backgroundEffect);
        

            // Create a video element for the product.image
            // let videoElement = document.createElement('video');
            // videoElement.src = product.image;
            // videoElement.muted = true; // Mute the audio
            // videoElement.autoplay = true; // Play the video automatically
            // videoElement.loop = true; // Loop the video
            // videoElement.style.width = '100%'; // Set the video width using CSS
            // videoElement.style.height = 'auto'; // Set the video height using CSS
            // newProduct.appendChild(videoElement);

            // if needed for adding to selected ticket type bit
            // <p>Selected Ticket Type: <span id="selectedTicket"></span></p>
            // <button class=saveticket" onclick="saveSelectedTicketType()">Save Ticket Type</button>
            
            let descriptionElement = document.createElement('div');
            descriptionElement.classList.add('description');
            descriptionElement.innerHTML +=
                `<h2>${selectedProduct.name}</h2>
                <div class="price">${selectedProduct.ticketDescription}</div>
                <div class="timing_header">Date and Time</div>
                <div class="timing">${selectedProduct.eventTime}</br></div>
                <div class="location_header">Location</div>
                <div class="location">${selectedProduct.eventLocation}</div>
                <div class="ticketHeading">Ticket Options</div>
                <div class="ticketRules">${selectedProduct.eventRules}</div>
                <table class="ticketSection" width="100%" style="position: relative; top: 405px;" border="0" cellspacing="0" cellpadding="4">
                    <tbody>
                        <tr style="background-color: #efefef; color:black;">
                            <td class="ticketSelection" width="20%" style="position: relative; left: 19px;"><strong>Ticket Selection</strong></td>
                            <td class="ticketPrice" width="5%"><strong>Price</strong></td>
                            <td class="ticketStatus" width="10%"><strong>Ticket Status</strong></td>
                            <td class="ticketTick" width="10%"><strong>Food Option</strong></td>
                            <td class="foodOption" width="10%"><strong>Meal</strong></td>
                            <td class="actionButton" width="30%"></td>
                        </tr>
                        <tr style="color:black; position: relative;">
                            <td style="position: relative; left: 20px;"><strong>${selectedProduct.option1}</strong></td>
                            <td><strong>€${ProductPriceOptionOne.price}</strong></td>
                            <td>
                                <strong>${ProductPriceOptionOne.productAvailability}</strong>
                            </td>
                            <td class="ticketStatus">
                                <div class="ticket-benefits">
                                    ${selectedProduct.hasSeatSelection ? 
                                        '<span class="vip-badge">VIP</span>' :
                                        '<input type="checkbox" id="ticket-checkbox-1" class="ticket-checkbox" onchange="toggleFoodSelect(this, \'food-option-1\')">'
                                    }
                                </div>
                            </td>
                            <td>
                                ${selectedProduct.hasSeatSelection ? `
                                <select class="food-select" id="food-option-1" onchange="updateFoodSelection(this, '${selectedProduct.option1}')">
                                    <option value="" selected>Select Food</option>    
                                    <option value="Chicken">Chicken Biryani</option>
                                    <option value="Veg">Veg Biryani</option>
                                </select>
                                ` : '-'}
                            </td>
                            <td style="position: relative;">
                                <button class="addtoCart" id="cart-btn-1" onclick="checkProductId('${selectedProduct.name}', '${selectedProduct.option1}', getFoodSelection('food-option-1'), getCheckSelection('ticket-checkbox-1'))">Add To Cart</button>
                            </td>
                        </tr>
                        <tr class="row2" style="color:black; position: relative;">
                            <td style="position: relative; left: 20px;"><strong>${selectedProduct.option2}</strong></td>
                            <td><strong>€${ProductPriceOptionTwo.price}</strong></td>
                            <td>
                                <strong>${ProductPriceOptionTwo.productAvailability}</strong>
                            </td>
                            <td class="ticketStatus">
                                <div class="ticket-benefits">
                                    ${ProductPriceOptionTwo.productAvailability === 'VIP' ? 
                                        '<span class="vip-badge">VIP</span>' :
                                        '<input type="checkbox" id="ticket-checkbox-2" class="ticket-checkbox" onchange="toggleFoodSelect(this, \'food-option-2\')">'
                                    }
                                </div>
                            </td>
                            <td>
                                ${selectedProduct.hasSeatSelection ? `
                                <select class="food-select" id="food-option-2" onchange="updateFoodSelection(this, '${selectedProduct.option1}')" disabled>
                                    <option value="" selected>Select Food</option>    
                                    <option value="Chicken">Chicken Biryani</option>
                                    <option value="Veg">Veg Biryani</option>
                                </select>
                                ` : '-'}
                            </td>
                            <td>
                                <button class="addtoCart2" onclick="checkProductId('${selectedProduct.name}', '${selectedProduct.option2}',getFoodSelection('food-option-2'), getCheckSelection('ticket-checkbox-2'))">Add To Cart</button>
                            </td>
                        </tr>   
                        ${ProductPriceOptionThree ? `
                            <tr class="row3" style="color:black; position: relative;">
                                <td style="position: relative; left: 20px;"><strong>${selectedProduct.option3}</strong></td>
                                <td><strong>€${ProductPriceOptionThree.price}</strong></td>
                                <td>
                                    <strong>${ProductPriceOptionThree.productAvailability}</strong>
                                </td>
                            <td class="ticketStatus">
                                <div class="ticket-benefits">
                                    ${ProductPriceOptionThree.productAvailability === 'VIP' ? 
                                        '<span class="vip-badge">VIP</span>' :
                                        '<input type="checkbox" id="ticket-checkbox-3" class="ticket-checkbox" onchange="toggleFoodSelect(this, \'food-option-3\')">'
                                    }
                                </div>
                            </td>
                            <td>
                                ${selectedProduct.hasSeatSelection ? `
                                <select class="food-select" id="food-option-3" onchange="updateFoodSelection(this, '${selectedProduct.option1}')" disabled>
                                    <option value="" selected>Select Food</option>    
                                    <option value="Chicken">Chicken Biryani</option>
                                    <option value="Veg">Veg Biryani</option>
                                </select>
                                ` : '-'}
                            </td>
                                <td>
                                    <button class="addtoCart3" onclick="checkProductId('${selectedProduct.name}', '${selectedProduct.option3}',getFoodSelection('food-option-3'), getCheckSelection('ticket-checkbox-3'))">Add To Cart</button>
                                </td>
                            </tr>` : ''}  
                        ${ProductPriceOptionFour ? `
                            <tr class="row4" style="color:black; position: relative;">
                                <td style="position: relative; left: 20px;"><strong>${selectedProduct.option4}</strong></td>
                                <td><strong>€${ProductPriceOptionFour.price}</strong></td>
                                <td>
                                    <strong>${ProductPriceOptionFour.productAvailability}</strong>
                                </td>
                            <td class="ticketStatus">
                                <div class="ticket-benefits">
                                    ${ProductPriceOptionFour.productAvailability === 'VIP' ? 
                                        '<span class="vip-badge">VIP</span>' :
                                        '<input type="checkbox" id="ticket-checkbox-4" class="ticket-checkbox" onchange="toggleFoodSelect(this, \'food-option-4\')">'
                                    }
                                </div>
                            </td>
                            <td>
                                ${selectedProduct.hasSeatSelection ? `
                                <select class="food-select" id="food-option-4" onchange="updateFoodSelection(this, '${selectedProduct.option1}')" disabled>
                                    <option value="" selected>Select Food</option>    
                                    <option value="Chicken">Chicken Biryani</option>
                                    <option value="Veg">Veg Biryani</option>
                                </select>
                                ` : '-'}
                            </td>
                                <td>
                                    <button class="addtoCart4" onclick="checkProductId('${selectedProduct.name}', '${selectedProduct.option4}',getFoodSelection('food-option-4'), getCheckSelection('ticket-checkbox-4'))">Add To Cart</button>
                                </td>
                            </tr>` : ''}    
                        ${ProductPriceOptionFive ? `
                            <tr class="row4" style="color:black; position: relative;">
                                <td style="position: relative; left: 20px;"><strong>${selectedProduct.option5}</strong></td>
                                <td><strong>€${ProductPriceOptionFive.price}</strong></td>
                                <td>
                                    <strong>${ProductPriceOptionFive.productAvailability}</strong>
                                </td>
                            <td class="ticketStatus">
                                <div class="ticket-benefits">
                                    ${ProductPriceOptionFive.productAvailability === 'VIP' ? 
                                        '<span class="vip-badge">VIP</span>' :
                                        '<input type="checkbox" id="ticket-checkbox-5" class="ticket-checkbox" onchange="toggleFoodSelect(this, \'food-option-5\')">'
                                    }
                                </div>
                            </td>
                            <td>
                                ${selectedProduct.hasSeatSelection ? `
                                <select class="food-select" id="food-option-5" onchange="updateFoodSelection(this, '${selectedProduct.option5}')" disabled>
                                    <option value="" selected>Select Food</option>    
                                    <option value="Chicken">Chicken Biryani</option>
                                    <option value="Veg">Veg Biryani</option>
                                </select>
                                ` : '-'}
                            </td>
                                <td>
                                    <button class="addtoCart4" onclick="checkProductId('${selectedProduct.name}', '${selectedProduct.option5}',getFoodSelection('food-option-5'), getCheckSelection('ticket-checkbox-5'))">Add To Cart</button>
                                </td>
                            </tr>` : ''}                
                    </tbody>
                </table>
                <label for="ticketType">Select Ticket Type:</label>
                <select style="opacity:0;" id="ticketType">
                    <option value="${selectedProduct.option1}">${selectedProduct.option1}</option>
                </select>
                <script></script>`;

            listProductHTML.appendChild(newProduct);
            listProductHTML.appendChild(descriptionElement);

            let addButtons = descriptionElement.querySelectorAll('button');
            addButtons.forEach(function (addButton) {
                addButton.addEventListener('click', function(){
                    if(cart.style.bottom == '-100%'){
                        cart.style.right = '0';
                        container.style.transform = 'translateX(-400px)';
                    } 
                    else {
                        cart.style.right = '0%';
                        container.style.transform = 'translateX(-400px)';
                        event_container.style.transform = 'translateX(-150px)';
                    }
                });
            });
            
            const ticketSelection = document.getElementById("ticketType");
            const ticketQuantityDesc = document.getElementById("ticketqty");
            ticketSelection.addEventListener("change", function() {
                const selectedValue = ticketSelection.value;

                const selectedProductName = ticketSelection.parentElement.querySelector('h2').textContent;
                const selectedProduct = products.find(product => product.name === selectedProductName);
            
                if (selectedProduct) {
                    // You can also get the price for the selected ticket type
                    selectedTicketType = selectedProduct.type.find(type => type.ticketType === selectedValue);
                    if (selectedTicketType) {
                        console.log(" ");
                    } else {
                        console.log(" ");
                    }
                } else {
                    console.log(" ");
                }
            });
            
        };
    }

function clearCart() {
    listCart = []; // Empty the cart array
    document.cookie = "listCart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"; // Remove the cart cookie
    addCartToHTML(); // Refresh the cart view
}


//use cookie so the cart doesn't get lost on refresh page

function checkCart(){
    var cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('listCart='));
    if(cookieValue){
        listCart = JSON.parse(cookieValue.split('=')[1]);
    }else{
        listCart = [];
    }
}
clearCart();
checkCart();

function navigateProduct() {
    //window.location.href = "SangeethaArangu.html";
}
fetch('/getProducts')
.then(response => response.json())
.then(data => {
    products = data;
    addEventToHTML();
})

function checkProductId(productName, productOption, foodSelection, CheckSelection){
    const selectedProduct = products.find(product => product.name === productName);
    const ticketSelection = document.getElementById("ticketType");
    const selectedValue = ticketSelection.value; // Get the selected value here

    let productID = null;
    let productQuantity = null;
    const shouldShowSeatSelection = selectedProduct.hasSeatSelection && 
    selectedProduct.seatSelectionTypes && 
    selectedProduct.seatSelectionTypes.includes(productOption);

    if (productOption === selectedProduct.option1) {
        const optionOne = selectedProduct.type.find(type => type.ticketType === selectedProduct.option1);
        productID = optionOne ? optionOne.id : null;
        productTicketType = optionOne ? optionOne.ticketType : null;
        productQuantity = optionOne ? optionOne.ticketQuantity : null;
    } 
    
    else if (productOption === selectedProduct.option2) {
        const optionTwo = selectedProduct.type.find(type => type.ticketType === selectedProduct.option2);
        productID = optionTwo ? optionTwo.id : null;
        productTicketType = optionTwo ? optionTwo.ticketType : null;
        productQuantity = optionTwo ? optionTwo.ticketQuantity : null;
    } 
    
    else if (productOption === selectedProduct.option3) {
        const optionThree = selectedProduct.type.find(type => type.ticketType === selectedProduct.option3);
        productID = optionThree ? optionThree.id : null;
        productTicketType = optionThree ? optionThree.ticketType : null;
        productQuantity = optionThree ? optionThree.ticketQuantity : null;
    }

    else if (productOption === selectedProduct.option4) {
        const optionFour = selectedProduct.type.find(type => type.ticketType === selectedProduct.option4);
        productID = optionFour ? optionFour.id : null;
        productTicketType = optionFour ? optionFour.ticketType : null;
        productQuantity = optionFour ? optionFour.ticketQuantity : null;
    }

    else if (productOption === selectedProduct.option5) {
        const optionFive = selectedProduct.type.find(type => type.ticketType === selectedProduct.option5);
        productID = optionFive ? optionFive.id : null;
        productTicketType = optionFive ? optionFive.ticketType : null;
        productQuantity = optionFive ? optionFive.ticketQuantity : null;
    }

    if (productID !== null) {
        if(productQuantity == 0){
            window.alert("The " + productTicketType + " ticket is sold out for this event.");
        }
        else{
            // Check if seat selection is enabled for this event and ticket type
            const shouldShowSeatSelection = selectedProduct.hasSeatSelection && 
                selectedProduct.seatSelectionTypes && 
                selectedProduct.seatSelectionTypes.includes(productTicketType);

                if (shouldShowSeatSelection && (!foodSelection)) {
                    window.alert("Please select a food option.");
                } else if (document.getElementById(CheckSelection)?.checked && (!foodSelection)) {
                    window.alert("Please select a food option before proceeding.");
                } else if (!seatMap && shouldShowSeatSelection) {
                    seatMap = new SeatMap('seat-map-container', productID, 1);
                    seatMap.init();
                } else if (selectedProduct.option5 === 'Extra Meal' && (!foodSelection)) {
                    window.alert("Please select a food option.");
                } else {
                    // Proceed with normal cart addition
                    addCart(productID, productTicketType, selectedValue, foodSelection);
                }
                
        }
    }
}

function adjustPromoHeaderMargin(){
    marginValue += 100; // Increment the margin by 20px each time
    promoHeader.style.marginTop = `${marginValue}px`;
    //promoHeader.style.opacity = 1;
    promoHeader.style.display = 'block';
}

// Modify your existing addCart function to handle selected seats
function addCart(productTypeID, productTicketType, selectedSeats = [], foodSelection) {
    let productsCopy = JSON.parse(JSON.stringify(products));


    if (!listCart[productTypeID]) {
        adjustPromoHeaderMargin();
        for (const product of productsCopy) {
            for (const productType of product.type) {
                if (productType.id == productTypeID) {
                    if (!listCart[productTypeID]) {
                        const productWithoutTicketDesc = { ...product };
                        delete productWithoutTicketDesc.ticketDescription;
                        listCart[productTypeID] = productWithoutTicketDesc;
                        listCart[productTypeID].quantity = 1;
                        listCart[productTypeID].ticketQuantity = productType.ticketQuantity;
                        listCart[productTypeID].staticQuantity = productType.ticketQuantity;
                        listCart[productTypeID].ticktype = productType.ticketType;
                        listCart[productTypeID].variablePrice = productType.price;

                        listCart[productTypeID].foodCount = {};
                        listCart[productTypeID].foodPrice = 0;
                        listCart[productTypeID].foodSelection = foodSelection;

                        // Add selected seats if available
                        if (selectedSeats.length > 0) {
                            listCart[productTypeID].selectedSeats = selectedSeats;
                        }

                        if (foodSelection) {
                            //listCart[productTypeID].foodPrice = 0;
                            listCart[productTypeID].foodSelection = foodSelection;
                        
                            // Initialize food tracking if not already present
                            listCart[productTypeID].foodCount = listCart[productTypeID].foodCount || {};
                            listCart[productTypeID].foodCount[foodSelection] = (listCart[productTypeID].foodCount[foodSelection] || 0) + 1;
                        
                            // Initialize foodSelections array
                            listCart[productTypeID].foodSelections = listCart[productTypeID].foodSelections || [];
                            listCart[productTypeID].foodSelections.push(foodSelection);
                        
                            // Save last selected food
                            listCart[productTypeID].selectedFood = foodSelection;

                            const hasSeatSelection = listCart[productTypeID].seatSelectionTypes?.includes(listCart[productTypeID].ticktype) && 
                            listCart[productTypeID].selectedSeats?.length > 0 || listCart[productTypeID].ticktype === "Extra Meal";

                            if (!hasSeatSelection) {
                                listCart[productTypeID].foodPrice = (listCart[productTypeID].foodPrice || 0) + 10;
                            }
                        }

                        if (listCart[productTypeID].ticketQuantity > 0) {
                            listCart[productTypeID].ticketQuantity--;
                        } else {
                            console.log(" ");
                        }
                    } else {
                        if (listCart[productTypeID].ticketQuantity > 0) {
                            console.log(" ");
                        } else {
                            console.log(" ");
                        }
                    }
                }
                else{
                    console.log(" ");
                }
            }
        }
    } else {
        if (listCart[productTypeID].ticketQuantity > 0) {
            listCart[productTypeID].quantity++;
            listCart[productTypeID].ticketQuantity--;

            //listCart[productTypeID].foodPrice += 10;
            //listCart[productTypeID].foodCount[foodSelection]++;
            const hasSeatSelection = listCart[productTypeID].seatSelectionTypes?.includes(listCart[productTypeID].ticktype) && 
            listCart[productTypeID].selectedSeats?.length > 0 || listCart[productTypeID].ticktype === "Extra Meal";

            if (foodSelection) {
                // Ensure foodCount exists
                listCart[productTypeID].foodCount = listCart[productTypeID].foodCount || {};

                // Increment food count
                listCart[productTypeID].foodCount[foodSelection] = 
                (listCart[productTypeID].foodCount[foodSelection] || 0) + 1;

                // Only add to foodPrice if this ticket does NOT have seat selection
                if (!hasSeatSelection) {
                    listCart[productTypeID].foodPrice = (listCart[productTypeID].foodPrice || 0) + 10;
                }

                // Optionally, track selectedFood if needed
                listCart[productTypeID].selectedFood = foodSelection;
            }

        } else {
            console.log(" ");
        }
    }
    
    document.cookie = "listCart=" + JSON.stringify(listCart) + "; path=/";
    addCartToHTML();

    // Emit cart update event if using WebSocket
    const ws = new WebSocket(host); // Replace with your WebSocket server URL
    ws.addEventListener('open', () => {
        const message = JSON.stringify({
            action: 'updateCart',
            cart: listCart,
            requestFetch: true
        });
        ws.send(message);
    });
    
}

addCartToHTML();
function addCartToHTML() {
    // Clear the default data
    let listCartHTML = document.querySelector('.listCart');
    listCartHTML.innerHTML = '';

    let totalHTML = document.querySelector('.totalQuantity');
    let totalQuantity = 0;

    // Get the selected ticket type from the HTML select element
    const ticketSelection = document.getElementById("ticketType");
    const selectedValue = ticketSelection.value;

    // If there are products in the cart
    if (listCart) {
        Object.entries(listCart).forEach(([productTypeID, product]) => {
            if (product) {
                let newCart = document.createElement('div');
                newCart.classList.add('item');

                let seatInfo = '';
                let foodSelect = '';
                if (product.seatSelectionTypes?.includes(product.ticktype) && product.selectedSeats?.length > 0) {
                    seatInfo = `<div class="seat-info">Seat${product.selectedSeats.length > 1 ? 's' : ''}: ${product.selectedSeats.join(', ')}</div>`;
                    const foodItems = Object.entries(product.foodCount).map(([foodName, quantity]) => {
                      return `<div class="seat-info">Meal: ${foodName} x${quantity}</div>`;
                    }).join('');
                    foodSelect = foodItems;
                    //foodSelect = `<div class="seat-info">Meal: ${product.selectedFood} x${product.foodCount}</div>`;
                } else {
                    if (product.foodCount) {
                        const foodItems = Object.entries(product.foodCount).map(([foodName, quantity]) => {
                            return `<div class="seat-info">Meal: ${foodName} x${quantity} (+€${quantity * 10})</div>`;
                        }).join('');
                        foodSelect = foodItems;
                    } else {
                        foodSelect = '';
                    }
                }                    
            
                //const foodSelection = foodSelect.value;

                // Find the price for the selected ticket type
                //let price = getPriceForSelectedType(product, selectedValue);

                //note that listCart[productTypeID].ticktype is also known as product.ticktype

                newCart.innerHTML = 
                    `<img src="${product.image}">
                    <div class="content">
                        <div class="name">${product.name}</div>
                        <div class="price">€${product.variablePrice} / ${product.ticktype}</div>
                        ${seatInfo}
                        ${foodSelect}
                    </div>
                    <div class="quantity">
                        <button onclick="changeQuantity(${productTypeID}, '-')">-</button>
                        <span class="value">${product.quantity}</span>
                        <button onclick="changeQuantity(${productTypeID}, '+', '${product.foodSelection}')">+</button>
                    </div>`;
                listCartHTML.appendChild(newCart);
                totalQuantity = totalQuantity + product.quantity;
            }
        });
    }
    totalHTML.innerText = totalQuantity;
    document.cookie = "listCart=" + JSON.stringify(listCart) + "; path=/";
}

function changeQuantity($idProduct, $type, foodSelection) {
    const product = listCart[$idProduct];
    const selectedProduct = products.find(p => {
        return p.type.some(t => t.id === parseInt($idProduct));
    });

    const ticketType = product.ticktype;
    const shouldShowSeatSelection = selectedProduct.hasSeatSelection && 
        selectedProduct.seatSelectionTypes && 
        selectedProduct.seatSelectionTypes.includes(ticketType);

    const selectedFood = product.foodSelection; // ✅ Safely reference stored food

    switch ($type) {
        case '+':
            if (listCart[$idProduct].ticketQuantity > 0) {
                if (shouldShowSeatSelection) {
                    // Show seat selection map for increment
                    if (!seatMap) {
                        seatMap = new SeatMap('seat-map-container', $idProduct, 1);
                        seatMap.init();
                    }
                } else {
                    // Regular increment for non-seat selection tickets
                    listCart[$idProduct].quantity++;
                    listCart[$idProduct].ticketQuantity--;

                    const ticketType = listCart[$idProduct].ticktype;
                    const hasSeatSelection = listCart[$idProduct].seatSelectionTypes?.includes(listCart[$idProduct].ticktype) && 
                    listCart[$idProduct].selectedSeats?.length > 0;
        
                    if (selectedFood) {
                        // Ensure foodCount exists
                        product.foodCount = product.foodCount || {};
                        product.foodCount[foodSelection] = (product.foodCount[foodSelection] || 0) + 1;
        
                        // Only add to foodPrice if this ticket does NOT have seat selection
                        if (!hasSeatSelection && ticketType !== "Extra Meal") {
                            product.foodPrice = (product.foodPrice || 0) + 10;
                        } else if (ticketType === "Extra Meal"){
                            product.foodPrice = (product.foodPrice || 0) + 0;
                        }
        
                        // Optionally, track selectedFood if needed
                        product.foodSelections = product.foodSelections || [];
                        product.foodSelections.push(selectedFood);
                    }
                }
            } else {
                console.log(" ");
            }
            break;

        case '-':
            if (shouldShowSeatSelection) {
                // Remove the last selected seat
                if (listCart[$idProduct].selectedSeats && listCart[$idProduct].selectedSeats.length > 0) {
                    const lastSeat = listCart[$idProduct].selectedSeats.pop();
                    fetch('/updateSeat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            eventId: $idProduct,
                            seatNumber: lastSeat,
                            status: 'available'
                        })
                    });
                }
            }
            
            listCart[$idProduct].quantity--;
            listCart[$idProduct].ticketQuantity++;

            if (selectedFood && product.foodCount?.[selectedFood]) {
                product.foodCount[selectedFood]--;
                product.foodPrice = Math.max((product.foodPrice || 0) - 10, 0);

                // Optional cleanup
                if (product.foodCount[selectedFood] === 0) {
                    delete product.foodCount[selectedFood];
                }
            }

            // Remove product from cart if quantity reaches 0
            if (listCart[$idProduct].quantity <= 0) {
                // Release all selected seats if any
                // if (listCart[$idProduct].selectedSeats) {
                //     listCart[$idProduct].selectedSeats.forEach(seat => {
                //         fetch('/updateSeat', {
                //             method: 'POST',
                //             headers: {
                //                 'Content-Type': 'application/json'
                //             },
                //             body: JSON.stringify({
                //                 eventId: $idProduct,
                //                 seatNumber: seat,
                //                 status: 'available'
                //             })
                //         });
                //     });
                // }
                delete listCart[$idProduct];
                //listCart = [];

                promoTag.classList.remove('show');
                deleteAllPromo();
                setPromoHeaderDefault();
                if (listCart.every(element => element === null)) {
                    promoHeader.style.display = 'none';
                    promoStatus.style.opacity = 0;
                }
            }
            break;

        default:
            break;
    }

    // Save cart data and update display
    document.cookie = "listCart=" + JSON.stringify(listCart) + "; path=/";
    addCartToHTML();
}

function checkPromo(promoCode){
    promoStatus.style.opacity = 1;
    const selectedPromotionName = promotions.find(availablePromos => availablePromos.promoName == "users");
    const selectedPromotionType = selectedPromotionName.type.find(type => type.promoType === promoCode);
    if(selectedPromotionType){
        promoStatus.style.display = 'block';
        promoStatus.style.color = 'green';
        promoStatus.textContent = `Promotion code '${promoCode}' applied successfully!`;

        setTimeout(function() {
            promoStatus.style.display = 'none'; // Assuming you want to hide the status after 5 seconds
        }, 5000); // 5000 milliseconds (5 seconds)
        
        promoTagName.textContent = `${promoCode}`;
        promoTag.style.display = 'grid';
        promoTag.classList.add('show');

        for (const productID in listCart) {
            if (listCart.hasOwnProperty(productID)) {
              // Add promotion information to the product
              listCart[productID].promotionApplied = selectedPromotionType.percentOff;
            }
        }
        promoApplyButton.style.color = 'grey';
        promoApplyButton.style.pointerEvents = 'none';

        document.getElementById('name').value = '';
        document.getElementById('name').disabled = true;
    }
    else {
        promoStatus.style.display = 'block';
        promoStatus.style.color = 'red';
        promoStatus.textContent = '⚠️ Enter a valid promo code.';
    }

    document.cookie = "listCart=" + JSON.stringify(listCart) + "; path=/";
}

function deleteAllPromo() {
    for (const productID in listCart) {
        if (listCart.hasOwnProperty(productID)) {
          // Add promotion information to the product
          delete listCart[productID].promotionApplied;
        }
    }
}

function getFoodSelection(selectId) {
    const select = document.getElementById(selectId);
    return select ? select.value : null;
}

function getCheckSelection(selectId) {
    // const select = document.getElementById(selectId);
    // return select ? select.value : null;
    const select = selectId;
    return select
}

function updateFoodSelection(selectElement, ticketType) {
    const cartButton = selectElement.parentElement.nextElementSibling.querySelector('button');
    // if (!selectElement.value) {
    //     cartButton.disabled = true;
    //     cartButton.style.opacity = '0.5';
    // } else {
    //     cartButton.disabled = false;
    //     cartButton.style.opacity = '1';
    // }
}

function toggleFoodSelect(checkbox, foodSelectId) {
    const foodSelect = document.getElementById(foodSelectId);
    if (foodSelect) {
        foodSelect.disabled = !checkbox.checked;
        
        // Reset food selection when unchecked
        if (!checkbox.checked) {
            foodSelect.value = "";
            updateFoodSelection(foodSelect, '${selectedProduct.option3}');
        }
    }
    
    // Also toggle the Add to Cart button
    const cartBtn = document.getElementById('cart-btn-3');
    if (cartBtn) {
        cartBtn.disabled = !checkbox.checked;
    }
}
