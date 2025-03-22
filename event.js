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

    marginValue -= 100; // Increment the margin by 20px each time
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

let listCart = [];

checkoutButton.addEventListener('click', function(){
    if (listCart.every(element => element === null) || listCart.length === 0) {
        // Don't do anything or show a message to the user indicating that the cart is empty.
        window.alert("Cart Empty!")
        //return;
    }
    else{
        window.location.href = '/checkout.html';
    }
})

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
    } else if (data.action === 'cartUpdated') {
      // Handle other actions, e.g., cart updates
      console.log('Cart updated by another user');
      
      // Check if the server requests a fetch to update the content
      if (data.requestFetch) {
        // Perform a fetch to update the products data
        fetch('/getProducts')
          .then(response => response.json())
          .then(updatedData => {
            // Update the products data with the fetched data
            products = updatedData;
            // Call the addDataToHTML function to update the page content
            //addDataToHTML();
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
    // const selectedProduct = products.find(product => product.eventID == globalProductID);
    //console.log(selectedProduct.appliedID);
    const ProductPriceOptionOne = selectedProduct.type.find(type => type.ticketType === selectedProduct.option1);
    const ProductPriceOptionTwo = selectedProduct.type.find(type => type.ticketType === selectedProduct.option2);
    const ProductPriceOptionThree = selectedProduct.type.find(type => type.ticketType === selectedProduct.option3);
    
    //console.log(ProductPriceOptionTwo.ticketQuantity);
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
    //console.log(selectedProduct);

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
                // console.log("height:", backgroundImage.height);
                // console.log("width:", backgroundImage.width);
        
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
                <table class ="ticketSection" width="100%" style="position: relative; top: 465px;" border="0" cellspacing="0" cellpadding="4">
                    <tbody>
                        <tr style="background-color: #efefef; color:black;">
                            <td width="30%" style="position: relative; left: 19px;"><strong>Ticket Selection</strong></td>
                            <td width="15%"><strong>Price</strong></td>
                            <td width="25%"><strong>Ticket Status</strong></td>
                            <td width="25%"></td>
                        </tr>
                        <tr style="color:black; position: relative; top: 5px;">
                            <td style="position: relative; left: 20px;"><strong>${selectedProduct.option1}</strong></td>
                            <td><strong>€${ProductPriceOptionOne.price}</strong></td>
                            <td>
                                <strong>
                                ${ProductPriceOptionOne.productAvailability}
                                </strong>
                                </td>
                            <td style="position: relative;">
                                <button class="addtoCart" onclick="checkProductId('${selectedProduct.name}', '${selectedProduct.option1}')">Add To Cart</button>
                            </td>
                        </tr>
                        <tr class = "row2" style="color:black; position: relative; top: 10px;">
                            <td style="position: relative; left: 20px;"><strong>${selectedProduct.option2}</strong></td>
                            <td><strong>€${ProductPriceOptionTwo.price}</strong></td>
                            <td>
                                <strong>
                                ${ProductPriceOptionTwo.productAvailability}
                                </strong>
                            </td>
                            <td>
                                <button class="addtoCart2" onclick="checkProductId('${selectedProduct.name}', '${selectedProduct.option2}')">Add To Cart</button>
                            </td>
                        </tr>   
                        <!-- Check if ProductPriceOptionThree exists before rendering the row -->
                        ${ProductPriceOptionThree ? `
                            <tr class="row3" style="color:black; position: relative; top: 15px;">
                                <td style="position: relative; left: 20px;"><strong>${selectedProduct.option3}</strong></td>
                                <td><strong>€${ProductPriceOptionThree.price}</strong></td>
                                <td>
                                    <strong>
                                        ${ProductPriceOptionThree.productAvailability}
                                    </strong>
                                </td>
                                <td>
                                    <button class="addtoCart3" onclick="checkProductId('${selectedProduct.name}', '${selectedProduct.option3}')">Add To Cart</button>
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
                //console.log("Selected Value: " + selectedValue);
                // const selectedProduct = product.name;

                const selectedProductName = ticketSelection.parentElement.querySelector('h2').textContent;
                //console.log("selectedProductName: " + selectedProductName);
                const selectedProduct = products.find(product => product.name === selectedProductName);
            
                if (selectedProduct) {
                    // Now 'selectedProduct' contains the product information based on the selected ticket type.
                    // You can use this information to update the cart view or perform any other actions.
                    //console.log("Selected Product:", selectedProduct);
                    
                    // You can also get the price for the selected ticket type
                    selectedTicketType = selectedProduct.type.find(type => type.ticketType === selectedValue);
                    //console.log("Selected TicketType: " + selectedTicketType);
                    if (selectedTicketType) {
                        //console.log("Selected TicketType: " + selectedTicketType.ticketType);
                        //console.log("Price: €" + selectedTicketType.price);
                        console.log(" ");
                    } else {
                        //console.log("Price not found for the selected ticket type.");
                        console.log(" ");
                    }
                } else {
                    //console.log("Product not found for the selected ID.");
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
    //console.log("done")
    addEventToHTML();
})

function checkProductId(productName, productOption){
    const selectedProduct = products.find(product => product.name === productName);
    //console.log(selectedProduct);
    const ticketSelection = document.getElementById("ticketType");
    const selectedValue = ticketSelection.value; // Get the selected value here
    //console.log("option1:" + selectedProduct.option1)

    let productID = null;
    let productQuantity = null;


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
        console.log("Here is child details: ", productID)
    }

    if (productID !== null) {
        //console.log("Product Name: " + selectedProduct.name);
        //console.log("Product TicketType: " + productTicketType);
        //console.log("Product ID: " + productID);
        //console.log("Product Quantity: " + productQuantity);
        // Call the addCart function with the product ID and selected value
        if(productQuantity == 0){
            window.alert("The " + productTicketType + " ticket is sold out for this event.");
            

        }
        else{
            addCart(productID, productTicketType, selectedValue);
        }
    }
}
function adjustPromoHeaderMargin(){
    marginValue += 100; // Increment the margin by 20px each time
    promoHeader.style.marginTop = `${marginValue}px`;
    //promoHeader.style.opacity = 1;
    promoHeader.style.display = 'block';
}

function addCart(productTypeID, productTicketType) {
    let productsCopy = JSON.parse(JSON.stringify(products));

    // If this product type is not in the cart
    if (!listCart[productTypeID]) {
        adjustPromoHeaderMargin();
        for (const product of productsCopy) {
            for (const productType of product.type) {
                if (productType.id == productTypeID) {
                    //console.log("Match" + productType.id);
                    if (!listCart[productTypeID]) {
                        const productWithoutTicketDesc = { ...product };
                        delete productWithoutTicketDesc.ticketDescription; //will avoid issues with adding to cart for document.cookie
                        listCart[productTypeID] = productWithoutTicketDesc;
                        console.log("product: ",productWithoutTicketDesc);
                        //listCart[productTypeID] = product;
                        listCart[productTypeID].quantity = 1;
                        listCart[productTypeID].ticketQuantity = productType.ticketQuantity;
                        listCart[productTypeID].staticQuantity = productType.ticketQuantity;
                        listCart[productTypeID].ticktype = productType.ticketType;
                        listCart[productTypeID].variablePrice = productType.price;
                        console.log("check here: " + listCart[productTypeID].ticktype);

                        if (listCart[productTypeID].ticketQuantity > 0) {
                            listCart[productTypeID].ticketQuantity--;
                            //console.log("updated quantity: " + listCart[productTypeID].ticketQuantity);
                        } 
                        
                        else {
                            //console.log("Max tickets reached");
                            console.log(" ");

                        }

                    } 
                    
                    else {
                        // If the product type is already in the cart, increase the quantity
                        if (listCart[productTypeID].ticketQuantity > 0) {
                            // listCart[productTypeID].quantity++;
                            // #listCart[productTypeID].ticketQuantity--;
                            //console.log("updated quantity: " + listCart[productTypeID].ticketQuantity);
                            console.log(" ");
                        } else {
                            //console.log("Max tickets reached");
                            console.log(" ");
                        }
                    }
                }
                else{
                    //console.log("Not a match" + productType.id);
                    console.log(" ");
                }
            }
        }
    } else {
        // If this product type is already in the cart, increase the quantity
        if (listCart[productTypeID].ticketQuantity > 0) {
            listCart[productTypeID].quantity++;
            listCart[productTypeID].ticketQuantity--;
            //console.log("updated quantity: " + listCart[productTypeID].ticketQuantity);
        } else {
            //console.log("Max tickets reached");
            console.log(" ");
        }
    }

    //console.log(listCart);
    
    // console.log(listCart[$idProduct]);
    document.cookie = "listCart=" + JSON.stringify(listCart);
    addCartToHTML();
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

                // Find the price for the selected ticket type
                //let price = getPriceForSelectedType(product, selectedValue);

                //note that listCart[productTypeID].ticktype is also known as product.ticktype

                newCart.innerHTML = 
                    `<img src="${product.image}">
                    <div class="content">
                        <div class="name">${product.name}</div>
                        <div class="price">€${product.variablePrice} / ${product.ticktype}</div>
                    </div>
                    <div class="quantity">
                        <button onclick="changeQuantity(${productTypeID}, '-')">-</button>
                        <span class="value">${product.quantity}</span>
                        <button onclick="changeQuantity(${productTypeID}, '+')">+</button>
                    </div>`;
                listCartHTML.appendChild(newCart);
                totalQuantity = totalQuantity + product.quantity;
                //console.log("product quantity: " + product.quantity);
                //console.log("product ticket type: " + listCart[productTypeID].ticktype);
            }
        });
    }
    totalHTML.innerText = totalQuantity;
    document.cookie = "listCart=" + JSON.stringify(listCart);
}

function changeQuantity($idProduct, $type) {
    switch ($type) {
        case '+':
            if (listCart[$idProduct].ticketQuantity > 0) {
                listCart[$idProduct].quantity++;
                listCart[$idProduct].ticketQuantity--;

                if (listCart[$idProduct].ticketQuantity === 0) {
                    //console.log("Max tickets reached");
                    console.log(" ");
                }
            } else {
                //console.log("Max tickets reached");
                console.log(" ");
            }
            break;
            case '-':
                listCart[$idProduct].quantity--;
                listCart[$idProduct].ticketQuantity++;
    
                // if quantity <= 0 then remove product in cart
                if (listCart[$idProduct].quantity <= 0) {
                    delete listCart[$idProduct];
                    //promoTag.style.display = 'none';
                    promoTag.classList.remove('show');
                    deleteAllPromo();
                    setPromoHeaderDefault();
                    //listCart = [];
                    
                    if (listCart.every(element => element === null)) {
                        promoHeader.style.display = 'none';
                        promoStatus.style.opacity = 0;
                    }
                } 
                
                else if (listCart[$idProduct].ticketQuantity === 0) {
                    //console.log("Max tickets reached");
                    console.log(" ");
                }
                break;
            default:
                break;
    }
    // save new data in the cookie
    document.cookie = "listCart=" + encodeURIComponent(JSON.stringify(listCart));
    // reload the HTML view cart
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

        // console.log(listCart.promotionApplied);
    }
    else {
        promoStatus.style.display = 'block';
        promoStatus.style.color = 'red';
        promoStatus.textContent = '⚠️ Enter a valid promo code.';
    }

    document.cookie = "listCart=" + JSON.stringify(listCart);
}

function deleteAllPromo() {
    for (const productID in listCart) {
        if (listCart.hasOwnProperty(productID)) {
          // Add promotion information to the product
          delete listCart[productID].promotionApplied;
        }
    }
}