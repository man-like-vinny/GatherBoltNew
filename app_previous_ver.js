const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');

menu.addEventListener('click', function() {
  menu.classList.toggle('is-active');
  menuLinks.classList.toggle('active');
});

let iconCart = document.querySelector('.iconCart');
let cart = document.querySelector('.cart');
let container = document.querySelector('.navbar');
let close = document.querySelector('.close');

iconCart.addEventListener('click', function(){
    if(cart.style.right == '-100%'){
        cart.style.right = '0';
        container.style.transform = 'translateX(-400px)';
    }else{
        cart.style.right = '-100%';
        container.style.transform = 'translateX(0)';
    }
})

close.addEventListener('click', function (){
    cart.style.right = '-100%';
    container.style.transform = 'translateX(0)';
})


let products = null;
// get data from file json
fetch('product.json')
    .then(response => response.json())
    .then(data => {
        products = data;
        addDataToHTML();
})

let selectedTicketType = null;

//show datas product in list 
// function addDataToHTML(){
//     // remove datas default from HTML
//     let listProductHTML = document.querySelector('.listProduct');
//     listProductHTML.innerHTML = '';

//     // add new datas
//     if(products != null) // if has data
//     {
//         products.forEach(product => {
//             let newProduct = document.createElement('div');
//             newProduct.classList.add('item');
//             newProduct.innerHTML = 
//             `<img src="${product.image}" alt="">
//             <h2>${product.name}</h2>
//             <div class="price">€${product.price}</div>
//             <button onclick="addCart(${product.id})">Add To Cart</button>`;

//             listProductHTML.appendChild(newProduct);

//             listProductHTML.addEventListener('click', function(){
//                 if(cart.style.right == '-100%'){
//                     cart.style.right = '0';
//                     container.style.transform = 'translateX(-400px)';
//                 }else{
//                     cart.style.right = '-100%';
//                     container.style.transform = 'translateX(0)';
//                 }
//             })
//         });
//     }
// }
// // Function to save the selected ticket type
// function saveSelectedTicketType() {
//     // Get the select element
//     const ticketTypeSelect = document.getElementById("ticketType");

//     // Get the selected value (either "earlyBird" or "standard")
//     selectedTicketType = ticketTypeSelect.value;

//     // Display the selected ticket type
//     const selectedTicketElement = document.getElementById("selectedTicket");
//     selectedTicketElement.textContent = selectedTicketType;

//     // You can use the 'selectedTicketType' variable as needed
//     // For example, you can perform different actions based on the selection.
//     if (selectedTicketType === "earlyBird") {
//         // Do something for Early Bird ticket
//     } else if (selectedTicketType === "standard") {
//         // Do something for Standard ticket
//     }
// }


function addDataToHTML() {
    // remove datas default from HTML
    let listProductHTML = document.querySelector('.listProduct');
    listProductHTML.innerHTML = '';

    // add new datas
    if (products != null) // if has data
    {
        products.forEach(product => {
            let newProduct = document.createElement('div');
            newProduct.classList.add('item');
            
            // Create a container for the background effect
            let backgroundEffect = document.createElement('div');
            backgroundEffect.classList.add('item-bg');
            backgroundEffect.style.backgroundImage = `url(${product.image})`;

            newProduct.appendChild(backgroundEffect);

            // if needed for adding to selected ticket type bit
            // <p>Selected Ticket Type: <span id="selectedTicket"></span></p>
            // <button class=saveticket" onclick="saveSelectedTicketType()">Save Ticket Type</button>
            newProduct.innerHTML += 
            `<h2>${product.name}</h2>
            <p>${product.description}</p>
            <div class="price">${product.ticketDescription}</div>
            <button onclick="addCart(${product.id})">Add To Cart</button>
            <label for="ticketType">Select Ticket Type:</label>
            <select id="ticketType">
                <option value="EarlyBird">EarlyBird</option>
                <option value="Standard">Standard</option>
            </select>
            <script src="script.js"></script>`;

            listProductHTML.appendChild(newProduct);

            let addButton = newProduct.querySelector('button');

            addButton.addEventListener('click', function(){
                if(cart.style.right == '-100%'){
                    cart.style.right = '0';
                    container.style.transform = 'translateX(-400px)';
                } else {
                    cart.style.right = '0%';
                    container.style.transform = 'translateX(-400px)';
                }
            });
            
            const ticketSelection = document.getElementById("ticketType");
            ticketSelection.addEventListener("change", function() {
                const selectedValue = ticketSelection.value;
                console.log("Selected value: " + selectedValue);
                fetch('product.json')
                .then(response => response.json())
                .then(data => {
                  // Find the specific product that matches the selected ticket type
                  const selectedProduct = data.find(product => product.id === parseInt(selectedValue));
            
                  if (selectedProduct) {
                    // Get the price based on the selected ticket type
                    const selectedTicketType = selectedProduct.type.split(' | ')
                      .find(type => type.includes(selectedValue));
                    
                    // Extract the price from the selected ticket type
                    const price = selectedTicketType ? price = selectedTicketType.split('/')[1] : "N/A";
            
                    // You can now use the 'price' variable as needed
                    console.log(`Selected Ticket Type: ${selectedValue}, Price: €${price}`);
                  }
                })
                .catch(error => {
                  console.error('Error loading product.json:', error);
                });            
            });
        });
    }
}

//use cookie so the cart doesn't get lost on refresh page
let listCart = [];
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
checkCart();
function checkProductId(){
    const ticketSelection = document.getElementById("ticketType");
    const selectedValue = ticketSelection.value; // Get the selected value here
    let productID = null;
    let productQuantity = null;

    products.forEach(product => {
        if (selectedValue === "EarlyBird") {
            const earlyBirdID = product.type.find(type => type.ticketType === "Early-bird");
            productID = earlyBirdID ? earlyBirdID.id : null;
            productQuantity =  earlyBirdID ? earlyBirdID.quantity : null;
        } else if (selectedValue === "Standard") {
            const standardID = product.type.find(type => type.ticketType === "Standard");
            productID = standardID ? standardID.id : null;
            productQuantity = standardID ? standardID.quantity : null;
        }
    
        console.log(productID);
        console.log(productQuantity);
        addCart(productID, productQuantity);
    })
}

function addCart($idProduct){
    let productsCopy = JSON.parse(JSON.stringify(products));
    //// If this product is not in the cart
    if(!listCart[$idProduct]) 
    {
        listCart[$idProduct] = productsCopy.filter(product => product.id == $idProduct)[0];
        listCart[$idProduct].quantity = 1;
    }else{
        //If this product is already in the cart.
        //I just increased the quantity
        listCart[$idProduct].quantity++;
    }
    document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";

    addCartToHTML();
}

// function addCart($idProduct,$quantityProduct){
//     console.log($idProduct);
//     let productsCopy = JSON.parse(JSON.stringify(products));
//     //// If this product is not in the cart
//     if(!listCart[$idProduct]) 
//     {
//         listCart[$idProduct] = productsCopy.filter(product => product.id == $idProduct)[0];
//         // listCart[$idProduct].quantity = 1;
//         listCart[$quantityProduct] = 1;
//     }else{
//         //If this product is already in the cart.
//         //I just increased the quantity
//         // listCart[$idProduct].quantity++;
//         listCart[$quantityProduct]++;
//     }
//     console.log(listCart[$idProduct]);
//     document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";

//     addCartToHTML();
// }
addCartToHTML();
function addCartToHTML(){
    // clear data default
    let listCartHTML = document.querySelector('.listCart');
    listCartHTML.innerHTML = '';

    let totalHTML = document.querySelector('.totalQuantity');
    let totalQuantity = 0;

    // Get the selected ticket type from the HTML select element
    const ticketSelection = document.getElementById("ticketType");
    const selectedValue = ticketSelection.value; // Get the selected value here

    // if has product in Cart
    if(listCart){
        listCart.forEach(product => {
            if(product){
                let newCart = document.createElement('div');
                newCart.classList.add('item');

                // Find the price for the selected ticket type
                let price = getPriceForSelectedType(product, selectedValue);

                newCart.innerHTML = 
                    `<img src="${product.image}">
                    <div class="content">
                        <div class="name">${product.name}</div>
                        <div class="price">€${price} / ${selectedValue}</div>
                    </div>
                    <div class="quantity">
                        <button onclick="changeQuantity(${product.id}, '-')">-</button>
                        <span class="value">${product.quantity}</span>
                        <button onclick="changeQuantity(${product.id}, '+')">+</button>
                    </div>`;
                listCartHTML.appendChild(newCart);
                totalQuantity = totalQuantity + product.quantity;
            }
        });
    }
    totalHTML.innerText = totalQuantity;
}

// Function to get the price based on the selected ticket type
function getPriceForSelectedType(product, selectedValue) {
    let price = null;
    // Check the selected ticket type and find the corresponding price
    if (selectedValue === "EarlyBird") {
        const earlyBirdPrice = product.type.find(type => type.ticketType === "Early-bird");
        price = earlyBirdPrice ? earlyBirdPrice.price : null;
    } else if (selectedValue === "Standard") {
        const standardPrice = product.type.find(type => type.ticketType === "Standard");
        price = standardPrice ? standardPrice.price : null;
    }
    return price;
}

function changeQuantity($idProduct, $type){
    switch ($type) {
        case '+':
            listCart[$idProduct].quantity++;
            break;
        case '-':
            listCart[$idProduct].quantity--;

            // if quantity <= 0 then remove product in cart
            if(listCart[$idProduct].quantity <= 0){
                delete listCart[$idProduct];
            }
            break;
    
        default:
            break;
    }
    // save new data in cookie
    document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";
    // reload html view cart
    addCartToHTML();
}