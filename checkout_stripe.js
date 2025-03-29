// This is a public sample test API key.
// Don’t submit any personally identifiable information in requests made with this key.
// Sign in to see your own test API key embedded in code samples.
const stripe = Stripe("pk_live_51O2y4dASLMn2l3lqKpiDGgetEi9CbrP9miuR4Ns4pLxktfpvBPKNqX7LHgsCxNHXwt5Z8oqcoyFWP1I0NpHE74sP004yeMSfkW");
//const stripe = Stripe("pk_test_51O2y4dASLMn2l3lqZONitI1i4fQZcrWdhq7khNIvEG66SADdBXVagGLrCLDoYDTh8gYeiLdwicrM91iL0gJE5UL400rNvTqxBC");
const validItems = listCart.filter(item => item !== null);

//console.log(listCart);
//console.log(validItems);

// The items the customer wants to buy
const itemsForStripe = validItems.map(product => {
  return {
    id: product.name, // Use a unique identifier for each item, e.g., the product name
    price: product.variablePrice * 100, // Convert to cents (Stripe requires prices in the smallest currency unit)
    fee: (0.01845 * (product.variablePrice * product.quantity) + 0.3075) * 100,
    staticQuant: product.staticQuantity,
    quantity: product.quantity,
    description: product.ticktype,
    inclFee: product.checkBooking,
    promoAmount: product.promotionApplied,
    selectedSeats: product.selectedSeats
  };
});

window.itemsForStripe = itemsForStripe;

// Access the itemsForStripe variable from the global scope
const items = window.itemsForStripe;
// const items = [{ id: "xl-tshirt" }];

items.forEach(item => {
  const itemId = item.id;
  const itemStatic = item.inclFee;
  //console.log("The item is the following: " + itemId);
  console.log("Booking fee: " + itemStatic);
  // Do something with the 'itemId' here, such as displaying it on the page or using it in your Stripe setup.
});

let elements;

initialize();
checkStatus();

document
  .querySelector("#payment-form")
  .addEventListener("submit", handleSubmit);

//clearCart();

let emailAddress = '';
let customerName = '';

// Fetches a payment intent and captures the client secret
async function initialize() {
  const response = await fetch("/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const { clientSecret, givenCustomerID } = await response.json();

  const appearance = {
    theme: 'stripe',
  };

  elements = stripe.elements({ appearance, clientSecret });

  const linkAuthenticationElement = elements.create("linkAuthentication");
  linkAuthenticationElement.mount("#link-authentication-element");

  linkAuthenticationElement.on('change', (event) => {
    emailAddress = event.value.email;
  });

  const paymentElementOptions = {
    layout: "tabs",
  };

  const options = { 
    mode: "billing",
  };

  const addressElement = elements.create('address', options);
  addressElement.mount('#address-element');

  addressElement.on('change', (event) => {
    customerName = event.value.name;
    customerID = givenCustomerID;
  })
  
  const paymentElement = elements.create("payment", paymentElementOptions);
  paymentElement.mount("#payment-element");
}

// async function handleSubmit(e) {
//   e.preventDefault();
//   setLoading(true);

//   //customerName = addressElement.name;
//   customerEmail = emailAddress;

//   spinnerOverlay.style.display = 'flex';

//   const insertCustomer = await fetch("/insert-customer-details", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ items, customerName, customerEmail, customerID }),
//   });
  
//   if(!insertCustomer.ok){
//     throw new Error ("Failed to send email") 
//   }

//   else{
//   const svgContent = await insertCustomer.text();

//   const { error, paymentIntent } = await stripe.confirmPayment({
//     elements,
//     confirmParams: {
//       // Make sure to change this to your payment completion page
//       return_url: "http://www.eventifyed.com/success.html",
//       //return_url: "/success.html",
//       receipt_email: emailAddress,
//     },
//   });
// }


//   //delayTimer(2000);

//   // This point will only be reached if there is an immediate error when
//   // confirming the payment. Otherwise, your customer will be redirected to
//   // your `return_url`. For some payment methods like iDEAL, your customer will
//   // be redirected to an intermediate site first to authorize the payment, then
//   // redirected to the `return_url`.
//   if (error.type === "card_error" || error.type === "validation_error") {
//     showMessage(error.message);
//   } else {
//     showMessage("An unexpected error occurred.");
//   }

//   setLoading(false);
// }

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  //customerName = addressElement.name;

  const {error} = await stripe.confirmPayment({
    elements,
    redirect: "if_required",
    confirmParams: {
      // Make sure to change this to your payment completion page
      return_url: "http://www.eventifyed.com/success.html",
      //return_url: "/success.html",
      receipt_email: emailAddress,
    },
  });

  if (error) {
    showMessage(error.message);
    spinnerOverlay.style.display = 'none';
    setLoading(false);
  } 
  
  else {
    spinnerOverlay.style.display = 'flex';
    customerEmail = emailAddress;

    const insertCustomer = await fetch("/insert-customer-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, customerName, customerEmail, customerID }),
    });

    if (!insertCustomer.ok) {
      throw new Error("Failed to send email");
    }

    else{
      const svgContent = await insertCustomer.text();
      window.location.href = "http://www.eventifyed.com/success.html";
    }
  }
}


// async function handleSubmit(e) {
//   e.preventDefault();
//   setLoading(true);

//   //customerName = addressElement.name;
//   customerEmail = emailAddress;

//   spinnerOverlay.style.display = 'flex';

//   const insertCustomer = await fetch("/insert-customer-details", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ items, customerName, customerEmail, customerID }),
//   });
  
//   if(!insertCustomer.ok){
//     throw new Error ("Failed to send email") 
//   }

//   else{
//     const { error, paymentIntent } = await stripe.confirmPayment({
//       elements,
//       redirect: "if_required",
//       confirmParams: {
//         // Make sure to change this to your payment completion page
//         return_url: "http://www.eventifyed.com/success.html",
//         //return_url: "/success.html",
//         receipt_email: emailAddress,
//       },
//     })

//     const svgContent = await insertCustomer.text();

//     if (error.type === "card_error" || error.type === "validation_error") {
//       showMessage(error.message);
//     } else {
//       showMessage("An unexpected error occurred.");
//     }

//     spinnerOverlay.style.display = 'none';
//     setLoading(false);
// }
//   //delayTimer(2000);
// }

// Fetches the payment intent status after payment submission
async function checkStatus() {
  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );

  if (!clientSecret) {
    return;
  }

  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

  switch (paymentIntent.status) {
    case "succeeded":
      showMessage("Payment succeeded!");
      break;
    case "processing":
      showMessage("Your payment is processing.");
      break;
    case "requires_payment_method":
      showMessage("Your payment was not successful, please try again.");
      break;
    default:
      showMessage("Something went wrong.");
      break;
  }
}

function clearCart() {
  listCart = []; // Empty the cart array
  document.cookie = "listCart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"; //clear cart after payment -- stops any back clicks
}

// ------- UI helpers -------

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageContainer.textContent = "";
  }, 4000);
}

// Show a spinner on payment submission
function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}