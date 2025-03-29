let listCart = [];
//let returntoCart = document.querySelector('.returnCart');
let returntoCart = document.querySelector('#returntocartlogo');
const spinnerOverlay = document.getElementById('spinner-overlay');
var host = location.origin.replace(/^http/, 'ws')

// function checkCart() {
//     var cookieValue = document.cookie
//         .split('; ')
//         .find(row => row.startsWith('listCart='));
//     if (cookieValue) {
//         listCart = JSON.parse(cookieValue.split('=')[1]);
//     }
// }

// Add this near the top of checkout.js
function checkCart() {
  var cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('listCart='));
  
  if (cookieValue) {
      try {
          // Parse the cookie value and handle sparse array
          let parsedCart = JSON.parse(cookieValue.split('=')[1]);
          // Convert sparse array to dense array by filtering out null/empty values
          listCart = parsedCart.filter(item => item !== null && item !== undefined);
          console.log("Number of cart items:", listCart.length);
          console.log("Cart contents:", listCart);
      } catch (e) {
          console.error("Error parsing cart:", e);
          listCart = [];
      }
  }
}


checkCart();

if(listCart.length === 0){
  window.location.href = "events.html";
}
else{
  addCartToHTML();
}


function addCartToHTML() {
    // clear data default
    let listCartHTML = document.querySelector('.returnCart .list');
    listCartHTML.innerHTML = '';

    let totalQuantityHTML = document.querySelector('.totalQuantity');
    let totalPriceHTML = document.querySelector('.totalPrice');
    let totalPromoHTML = document.querySelector('.totalPromo');
    let totalPromoHeaderHTML = document.querySelector('.totalPromoHeader');
    let totalQuantity = 0;
    let totalPrice = 0;
    let completePrice = 0;
    let discountAmount = 0;

    // if there are products in the Cart
    if (listCart && listCart.length > 0) {
        listCart.forEach(product => {
            if (product) {
                let newCart = document.createElement('div');
                newCart.classList.add('item');
                // Generate seat info if seats are selected
                let seatInfo = '';
                if (product.seatSelectionTypes?.includes(product.ticktype) && product.selectedSeats?.length > 0) {
                    seatInfo = `<div class="seat-info">Seat${product.selectedSeats.length > 1 ? 's' : ''}: ${product.selectedSeats.join(', ')}</div>`;
                }

                newCart.innerHTML =
                    `<img src="${product.staticImage}">
                    <div class="info">
                        <div class="name">${product.name}</div>
                        <div class="price">Selected Ticket: ${product.ticktype}</div>
                        ${seatInfo}
                    </div>
                    <div class="quantity">x${product.quantity}</div>
                    <div class="returnPrice">€${product.variablePrice * product.quantity}</div>`;

                listCartHTML.appendChild(newCart);
                totalQuantity = totalQuantity + product.quantity;

                fee = (0.01845 * (product.variablePrice * product.quantity) + 0.3075) * 100;
                promoAmount = product.promotionApplied;
                beforeFeePrice = completePrice = Math.round(totalPrice + (product.variablePrice * product.quantity * 100))
                completePrice = Math.round(totalPrice + (product.variablePrice * product.quantity * 100) + fee);
                console.log(product.checkBooking);
                if(product.checkBooking == "True"){
                  if(promoAmount){
                    discountAmount = (promoAmount/100 * beforeFeePrice);
                    totalPrice = Math.round(completePrice - discountAmount); // 0.25 represents 25%
                  }
                  else{
                    totalPrice = completePrice;
                  }
                }
                else{
                  if(promoAmount){
                    oneTimeDiscount = (promoAmount / 100) * (product.variablePrice * product.quantity * 100);
                    discountAmount = discountAmount + (promoAmount / 100) * (product.variablePrice * product.quantity * 100);
                    totalPrice = totalPrice + (product.variablePrice * product.quantity * 100) - oneTimeDiscount;
                  }
                  else{
                    totalPrice = totalPrice + (product.variablePrice * product.quantity * 100);
                  }
                }
                //console.log("check total price here: " + totalPrice);
            }
        });
    }
    totalQuantityHTML.innerText = totalQuantity;
    if (promoAmount) {
      totalPromoHeaderHTML.innerText = `Promotion Applied (${promoAmount}% OFF)`
      totalPromoHTML.innerText = `-${discountAmount/100}`;
    }
    else{
      let totalPromoContainer = document.querySelector('.row-totalPromoContainer');
      if(totalPromoContainer){
        totalPromoContainer.style.display = 'none';
      }
    }
    totalPriceHTML.innerText = "€" + totalPrice/100;

    //updateCartOnServer(listCart);
}

returntoCart.addEventListener('click', function() {
    // Perform a fetch to get updated product data

    spinnerOverlay.style.display = 'flex';
    
    fetch('/getProducts')
    .then(response => response.json())
    .then(updatedData => {
        const validCart = listCart.filter(item => item !== null);

        // Update item.ticketQuantity values with the latest data
        validCart.forEach(item => {
            // Find the product with the matching name
            const matchingProduct = updatedData.find(product => product.name === item.name);

            if (matchingProduct) {
                // Find the corresponding ticketType
                const matchingTicket = matchingProduct.type.find(ticket => ticket.ticketType === item.ticktype);
                //console.log(matchingTicket);
                if (matchingTicket) {
                    // Update item.ticketQuantity with the value from the matching ticket
                    item.ticketQuantity = matchingTicket.ticketQuantity;
                    //console.log(matchingTicket.ticketQuantity);
                }
            }
        });

        // Now that item.ticketQuantity values are updated, you can perform calculations
        validCart.forEach(item => {
            item.ticketQuantity = item.ticketQuantity + item.quantity;
        });

        //console.log(validCart);

        // Clear the cart locally or handle it as needed

        // Update the page or perform any additional actions with the updated data
        // ...

        // Call updateCartOnServer after all operations are complete
        updateCartOnServer(validCart);
        delayTimer(2000);
        //spinnerOverlay.style.display = 'none';
    });
});

function clearCart() {
    listCart = []; // Empty the cart array
    document.cookie = "listCart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"; // Remove the cart cookie
}

//------------------------------------------updating cart logic below------------------------------------------------------------

function updateCartOnServer(cart) {
    // Send a WebSocket message to update the cart on the server
    // const ws = new WebSocket('wss://www.eventifyed.com:5000'); // Replace with your WebSocket server URL
    const ws = new WebSocket(host); // Replace with your WebSocket server URL
  
    ws.addEventListener('open', () => {
      //console.log('WebSocket connection is open.');

      const message = JSON.stringify({
        action: 'updateCart',
        cart: cart,
        requestFetch: true,
      });
      ws.send(message);
    });

    ws.addEventListener('ping', () => {
        // When a ping message is received from the server, respond with a pong
        ws.pong();
        //console.log('Sent a ping to the server.');
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
      if(data.action == 'numberOfClients'){
        const numberOfClients = data.count;
        console.log(`Number of connected clients: ${numberOfClients}`);
      }
      else if (data.action === 'cartUpdated') {
        // Handle the case where the cart has been updated by another user.
        // You can update the client's cart and UI here.
        console.log('Cart updated by another user');
        //alert('Another user updated the cart');

        if (data.requestReload) {
            // Reload the page when requested by the server
            window.location.reload();
          }
        //checkCart(); // Update the cart on the client side
      }
    });
}

function startTimer() {
    const startTime = new Date().getTime();
    const timerDuration = 10 * 60 * 1000; // 1 minute in milliseconds
  
    const timerInterval = setInterval( () => {
      const currentTime = new Date().getTime();
      const timeRemaining = startTime + timerDuration - currentTime;
  
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        try {
          handleTimerExpiration();
          // All calculations and API calls are complete, redirect to events.html
          //clearCart();
          delayTimer(2000);
        } catch (error) {
          console.error('Error during calculations:', error);
        }
      } else {
        // Update the timer display with the time remaining.
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        document.getElementById('timer-display').textContent = `${minutes}:${seconds}`;
      }
    }, 1000);
  }
  
  function handleTimerExpiration() {
    fetch('/getProducts')
    .then(response => response.json())
    .then(updatedData => {
        const validCart = listCart.filter(item => item !== null);

        // Update item.ticketQuantity values with the latest data
        validCart.forEach(item => {
            // Find the product with the matching name
            const matchingProduct = updatedData.find(product => product.name === item.name);

            if (matchingProduct) {
                // Find the corresponding ticketType
                const matchingTicket = matchingProduct.type.find(ticket => ticket.ticketType === item.ticktype);
                console.log(matchingTicket);
                if (matchingTicket) {
                    // Update item.ticketQuantity with the value from the matching ticket
                    item.ticketQuantity = matchingTicket.ticketQuantity;
                    console.log(matchingTicket.ticketQuantity);
                }
            }
        });

        // Now that item.ticketQuantity values are updated, you can perform calculations
        validCart.forEach(item => {
            item.ticketQuantity = item.ticketQuantity + item.quantity;
        });

      updateCartOnServer(validCart);
    });
  };

  function delayTimer(delay){
    setTimeout(function() {
        console.log("delay taken place");
        window.location.href = '/events.html';
    }, delay);
  }

window.onload = () => {
    //checkCart();
    updateCartOnServer(listCart);
    startTimer();
  };
