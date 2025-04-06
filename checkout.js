let listCart = [];
//let returntoCart = document.querySelector('.returnCart');
let returntoCart = document.querySelector('#returntocartlogo');
const spinnerOverlay = document.getElementById('spinner-overlay');
var host = location.origin.replace(/^http/, 'ws')

function checkCart() {
    var cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('listCart='));
    if (cookieValue) {
        listCart = JSON.parse(cookieValue.split('=')[1]);
    }
}

checkCart();

// Add this near the top of checkout.js
// function checkCart() {
//   var cookieValue = document.cookie
//       .split('; ')
//       .find(row => row.startsWith('listCart='));
  
//   if (cookieValue) {
//       try {
//           // Parse the cookie value and handle sparse array
//           let parsedCart = JSON.parse(cookieValue.split('=')[1]);
//           // Convert sparse array to dense array by filtering out null/empty values
//           listCart = parsedCart.filter(item => item !== null && item !== undefined);
//       } catch (e) {
//           console.error("Error parsing cart:", e);
//           listCart = [];
//       }
//   }
// }

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
                let foodSelect = '';

                if (product.seatSelectionTypes?.includes(product.ticktype) && product.selectedSeats?.length > 0) {
                    seatInfo = `<div class="seat-info">Seat${product.selectedSeats.length > 1 ? 's' : ''}: ${product.selectedSeats.join(', ')}</div>`;

                    if (product.foodCount) {
                        const foodItems = Object.entries(product.foodCount).map(([foodName, quantity]) => {
                            return `<div class="seat-info">Meal: ${foodName} x${quantity}</div>`; // No price
                        }).join('');
                        foodSelect = foodItems;
                    }
                } else if (product.ticktype === "Extra Meal" && product.foodCount) {
                    const foodItems = Object.entries(product.foodCount).map(([foodName, quantity]) => {
                        return `<div class="seat-info">Meal: ${foodName} x${quantity}</div>`; // No price for Extra Meal
                    }).join('');
                    foodSelect = foodItems;
                } else if (product.foodCount) {
                    const foodItems = Object.entries(product.foodCount).map(([foodName, quantity]) => {
                        return `<div class="seat-info">Meal: ${foodName} x${quantity} (+€${quantity * 10})</div>`; // With price
                    }).join('');
                    foodSelect = foodItems;
                } else {
                    foodSelect = '';
                }

                newCart.innerHTML =
                    `<img src="${product.staticImage}">
                    <div class="info">
                        <div class="name">${product.name}</div>
                        <div class="price">Selected Ticket: ${product.ticktype}</div>
                        ${seatInfo}
                        ${foodSelect}
                    </div>
                    <div class="quantity">x${product.quantity}</div>
                    <div class="returnPrice">€${product.variablePrice * product.quantity}</div>`;

                listCartHTML.appendChild(newCart);
                totalQuantity = totalQuantity + product.quantity;

                const baseTicketPrice = product.variablePrice * product.quantity * 100;
                const baseFoodPrice = product.foodPrice ? product.foodPrice * 100 : 0;
                const baseTotalPrice = baseTicketPrice + baseFoodPrice;
                
                // Calculate fee
                let fee = (0.01845 * (baseTotalPrice / 100) + 0.3075) * 100;
                
                // Store initial price before applying discount
                let beforeFeePrice = totalPrice + baseTotalPrice;
                let completePrice = Math.round(beforeFeePrice + fee);

                promoAmount = product.promotionApplied;

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
                    const oneTimeDiscount = (promoAmount / 100) * baseTotalPrice;
                    discountAmount += oneTimeDiscount;
                    totalPrice += baseTotalPrice - oneTimeDiscount;
                  }
                  else{
                    totalPrice += baseTotalPrice;
                  }
                }
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

// returntoCart.addEventListener('click', function() {
//     // Perform a fetch to get updated product data

//     spinnerOverlay.style.display = 'flex';
    
//     fetch('/getProducts')
//     .then(response => response.json())
//     .then(updatedData => {
//         const validCart = listCart.filter(item => item !== null);

//         // Update item.ticketQuantity values with the latest data
//         validCart.forEach(item => {
//             // Find the product with the matching name
//             const matchingProduct = updatedData.find(product => product.name === item.name);

//             if (matchingProduct) {
//                 // Find the corresponding ticketType
//                 const matchingTicket = matchingProduct.type.find(ticket => ticket.ticketType === item.ticktype);
//                 //console.log(matchingTicket);
//                 if (matchingTicket) {
//                     // Update item.ticketQuantity with the value from the matching ticket
//                     item.ticketQuantity = matchingTicket.ticketQuantity;
//                     //console.log(matchingTicket.ticketQuantity);
//                 }
//             }
//         });

//         // Now that item.ticketQuantity values are updated, you can perform calculations
//         validCart.forEach(item => {
//             item.ticketQuantity = item.ticketQuantity + item.quantity;
//         });

//         //console.log(validCart);

//         // Clear the cart locally or handle it as needed

//         // Update the page or perform any additional actions with the updated data
//         // ...

//         // Call updateCartOnServer after all operations are complete
//         updateCartOnServer(validCart);
//         delayTimer(2000);
//         //spinnerOverlay.style.display = 'none';
//     });

//     const eventId = "YSM2025"; // Replace with actual event ID

//     fetch(`/getSeats/${eventId}`)
//     .then(response => response.json())
//     .then(updatedData => {

//         seat = updatedData;

//         // const seatData = seats?.find(seat => seat.seatNumber === seatNumber);
//         // if (seatData) {
//         // seat.className = `seat ${seatData.status}`;
//         // }
        
//         const validCart = listCart.filter(item => item !== null);

//         const seatData = seats?.find(seat => seat.seatNumber === seatNumber);
//         if (seatData) {
//         seat.className = `seat ${seatData.status}`;
//         }

//         validCart.forEach(item => {
//             // Find the product with the matching name
//             const matchingProduct = updatedData.find(product => product.name === item.name);

//             if (matchingProduct) {
//                 // Find the corresponding ticketType
//                 const matchingTicket = matchingProduct.type.find(ticket => ticket.ticketType === item.ticktype);

//                 if (matchingTicket) {

//                     // Check for matching seats and update their status
//                     item.selectedSeats.forEach(selectedSeat => {
//                         const matchingSeat = updatedData.find(seat => 
//                           seat.seatNumber === selectedSeat.seatNumber &&
//                           seat.row === selectedSeat.row &&
//                           seat.status === "available"
//                         );

//                         if (matchingSeat) {
//                             matchingSeat.status = "unavailable";
//                         }
//                     });
//                 }
//             }
//         });

//         console.log(updatedData); // Check the modified seat status
//         //updateSeatOnServer(validCart);
//         //delayTimer(2000);
//     })
//     .catch(error => console.error('Error fetching seats:', error));

// });

returntoCart.addEventListener('click', function() {
  // Perform a fetch to get updated product data
  spinnerOverlay.style.display = 'flex';

  fetch('/getProducts')
  .then(response => response.json())
  .then(updatedData => {
      const validCart = listCart.filter(item => item !== null);

      // Update item.ticketQuantity values with the latest data
      validCart.forEach(item => {
          const matchingProduct = updatedData.find(product => product.name === item.name);

          if (matchingProduct) {
              const matchingTicket = matchingProduct.type.find(ticket => ticket.ticketType === item.ticktype);
              if (matchingTicket) {
                  item.ticketQuantity = matchingTicket.ticketQuantity;
              }
          }
      });

      validCart.forEach(item => {
          item.ticketQuantity = item.ticketQuantity + item.quantity;
      });

      // Call updateCartOnServer after all operations are complete
      //updateCartOnServer(validCart);
      return new Promise(resolve => setTimeout(() => resolve(updatedData), 2000));
  })
  .then(updatedData => {
      // Now fetch seat data after updating products
      const eventId = "YSM2025"; // Replace with actual event ID

      return fetch(`/getSeats/${eventId}`)
      .then(response => response.json())
      .then(updatedSeatData => {
          seat = updatedSeatData;

          const validCart = listCart.filter(item => item !== null);
          const matchingSeats = [];

          validCart.forEach(item => {
              const matchingProduct = updatedData.find(product => product.name === item.name);

              if (matchingProduct) {
                  const matchingTicket = matchingProduct.type.find(ticket => ticket.ticketType === item.ticktype);

                  if (matchingTicket) {
                    if(Array.isArray(item.selectedSeats)) {
                      item.selectedSeats.forEach(selectedSeat => {
                          const matchingSeat = seat.find(seat => 
                            seat.seatNumber === selectedSeat
                          );

                          if (matchingSeat) {
                              matchingSeat.status = "available";
                              matchingSeats.push(matchingSeat.seatNumber); // Store in array
                          }
                          else{
                            console.log("No ticket found")
                          }
                      });
                    } else {
                      console.log("No seat selection for ticket type: ", item.ticktype)
                    }
                  }
              }
          });
          updateCartOnServer(validCart, matchingSeats);
          delayTimer(2000);
      });
  })
  .catch(error => console.error('Error fetching data:', error));
});


function clearCart() {
    listCart = []; // Empty the cart array
    document.cookie = "listCart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"; // Remove the cart cookie
}

//------------------------------------------updating seat logic below------------------------------------------------------------
function updateSeatOnServer(seatData){
    // Send a WebSocket message to update the cart on the server
    // const ws = new WebSocket('wss://www.eventifyed.com:5000'); // Replace with your WebSocket server URL
    const ws = new WebSocket(host); // Replace with your WebSocket server URL
  
    ws.addEventListener('open', () => {
      const message = JSON.stringify({
        action: 'seatUpdate',
        seats: seatData,
        requestFetch: true,
      });
      ws.send(message);
    });

    ws.addEventListener('ping', () => {
        // When a ping message is received from the server, respond with a pong
        ws.pong();
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

//------------------------------------------updating cart logic below------------------------------------------------------------
function updateCartOnServer(cart, seats) {
    // Send a WebSocket message to update the cart on the server
    // const ws = new WebSocket('wss://www.eventifyed.com:5000'); // Replace with your WebSocket server URL
    const ws = new WebSocket(host); // Replace with your WebSocket server URL
  
    ws.addEventListener('open', () => {
      const message = JSON.stringify({
        action: 'updateCart',
        cart: cart,
        seats: seats,
        requestFetch: true,
      });
      ws.send(message);
    });

    ws.addEventListener('ping', () => {
        // When a ping message is received from the server, respond with a pong
        ws.pong();
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

        // if (data.requestReload) {
        //     // Reload the page when requested by the server
        //     window.location.reload();
        //   }
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
          //delayTimer(2000);
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
            const matchingProduct = updatedData.find(product => product.name === item.name);
  
            if (matchingProduct) {
                const matchingTicket = matchingProduct.type.find(ticket => ticket.ticketType === item.ticktype);
                if (matchingTicket) {
                    item.ticketQuantity = matchingTicket.ticketQuantity;
                }
            }
        });
  
        validCart.forEach(item => {
            item.ticketQuantity = item.ticketQuantity + item.quantity;
        });
  
        // Call updateCartOnServer after all operations are complete
        //updateCartOnServer(validCart);
        return new Promise(resolve => setTimeout(() => resolve(updatedData), 2000));
    })
    .then(updatedData => {
        // Now fetch seat data after updating products
        const eventId = "YSM2025"; // Replace with actual event ID
  
        return fetch(`/getSeats/${eventId}`)
        .then(response => response.json())
        .then(updatedSeatData => {
            seat = updatedSeatData;
  
            const validCart = listCart.filter(item => item !== null);
            const matchingSeats = [];
  
            validCart.forEach(item => {
                const matchingProduct = updatedData.find(product => product.name === item.name);
  
                if (matchingProduct) {
                    const matchingTicket = matchingProduct.type.find(ticket => ticket.ticketType === item.ticktype);
  
                    if (matchingTicket) {
                        item.selectedSeats.forEach(selectedSeat => {
                            const matchingSeat = seat.find(seat => 
                              seat.seatNumber === selectedSeat
                            );
  
                            if (matchingSeat) {
                                console.log(matchingSeat)
                                matchingSeat.status = "available";
                                matchingSeats.push(matchingSeat.seatNumber); // Store in array
                            }
                            else{
                              console.log("No ticket found")
                            }
                        });
                    }
                }
            });
            updateCartOnServer(validCart, matchingSeats);
            delayTimer(2000);
        });
    })
    .catch(error => console.error('Error fetching data:', error));
  }

  function delayTimer(delay){
    setTimeout(function() {
        window.location.href = '/events';
    }, delay);
  }

window.onload = () => {
    //checkCart();
    updateCartOnServer(listCart);
    startTimer();
  };
