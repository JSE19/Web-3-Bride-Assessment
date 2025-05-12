console.log("script.js file has been loaded and is running!");
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired!");
    // Variables
    const productListDiv = document.getElementById('product-list');
    const cartItemsDiv = document.getElementById('cart-items');
    const subtotalSpan = document.getElementById('subtotal');
    const discountSpan = document.getElementById('discount');
    const totalSpan = document.getElementById('total');
    const couponInput = document.getElementById('coupon-code');
    const applyCouponButton = document.getElementById('apply-coupon');
    const messageDiv = document.getElementById('messages');
    const checkoutButton = document.getElementById('checkout-btn');

    
    const VALID_COUPON_CODE = 'WEB3BRIDGECOHORTx'; 
    const DISCOUNT_RATE = 0.10; 
    const STORAGE_KEY_CART = 'shoppingCart';
    const STORAGE_KEY_COUPON = 'appliedCoupon';

    // Product Data 
    const products = [
        { id: 1, name: "Laptop Pro", price: 1200.00, imageUrl: "images/laptop-from-above.jpg" },
        { id: 2, name: "Wireless Mouse", price: 25.50, imageUrl: "images/laptop-from-above.jpg" },
        { id: 3, name: "Keyboard RGB", price: 75.99, imageUrl: "images/laptop-from-above.jpg" },
        { id: 4, name: "Webcam HD", price: 50.00, imageUrl: "images/laptop-from-above.jpg" },
        { id: 5, name: "Monitor 24\"", price: 180.75, imageUrl: "images/laptop-from-above.jpg" },
        { id: 6, name: "USB Hub", price: 15.25, imageUrl: "images/laptop-from-above.jpg" },
        { id: 7, name: "External SSD 1TB", price: 110.00, imageUrl: "images/laptop-from-above.jpg" },
        { id: 8, name: "Gaming Headset", price: 95.50, imageUrl: "images/laptop-from-above.jpg" },
        { id: 9, name: "Laptop Stand", price: 30.00, imageUrl: "images/laptop-from-above.jpg" },
        { id: 10, name: "Desk Lamp", price: 22.99, imageUrl: "images/laptop-from-above.jpg" },
        { id: 11, name: "Smartphone X", price: 899.99, imageUrl: "images/laptop-from-above.jpg" },
        { id: 12, name: "Tablet S", price: 450.00, imageUrl: "images/laptop-from-above.jpg" },

    ];

    // State Variables
    let cart = []; 
    let appliedCoupon = null; 

    // Function Initializations
    loadCartFromStorage();
    loadCouponFromStorage();
    displayProducts();
    renderCart(); // Initial render

    // Functions 

    function displayProducts() {
        productListDiv.innerHTML = ''; 
        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product-item');
            productDiv.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="add-to-cart" data-product-id="${product.id}">Add to Cart</button>
            `;
            productListDiv.appendChild(productDiv);
        });
    }

    function findProductById(productId) {
        // Convert productId to number just in case it comes as string from data attribute
        return products.find(p => p.id === Number(productId));
    }

    function addToCart(productId) {
        productId = Number(productId); // Ensure it's a number
        const existingItemIndex = cart.findIndex(item => item.productId === productId);

        if (existingItemIndex > -1) {
            // Item already in cart, increase quantity
            cart[existingItemIndex].quantity++;
        } else {
            // Add new item to cart
            cart.push({ productId: productId, quantity: 1 });
        }
        saveCartToStorage();
        renderCart();
        showMessage('Item added to cart.', 'success');
    }

    function updateQuantity(productId, newQuantity) {
        productId = Number(productId);
        newQuantity = Number(newQuantity);

        // Input Validation: Prevent non-positive quantities
        if (newQuantity <= 0) {
            // Instead of just preventing, let's remove the item if quantity is 0 or less
            console.log(`Quantity for product ${productId} set to ${newQuantity}. Removing item.`);
            removeFromCart(productId);
             showMessage('Item removed from cart due to zero quantity.', 'info'); // Use info or keep silent
            return; // Exit function after removal
        }

        const itemIndex = cart.findIndex(item => item.productId === productId);
        if (itemIndex > -1) {
            cart[itemIndex].quantity = newQuantity;
            saveCartToStorage();
            renderCart(); // Re-render to reflect changes and recalculate total
        } else {
            console.error("Tried to update quantity for item not in cart:", productId);
            showMessage('Error updating quantity.', 'error');
        }
    }


    function removeFromCart(productId) {
        productId = Number(productId);
        cart = cart.filter(item => item.productId !== productId);
        saveCartToStorage();
        renderCart();
        showMessage('Item removed from cart.', 'success');
    }

    function calculateTotals() {
        let subtotal = 0;
        cart.forEach(item => {
            const product = findProductById(item.productId);
            if (product) {
                subtotal += product.price * item.quantity;
            }
        });

        let discount = 0;
        if (appliedCoupon === VALID_COUPON_CODE) {
            discount = subtotal * DISCOUNT_RATE;
        }

        const total = subtotal - discount;

        // Ensure non-negative total
        const finalTotal = Math.max(0, total);

        return {
            subtotal: subtotal,
            discount: discount,
            total: finalTotal
        };
    }

    function renderCart() {
        cartItemsDiv.innerHTML = ''; // Clear previous items
        hideMessage(); // Clear any previous messages

        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
            couponInput.disabled = true;
            applyCouponButton.disabled = true;
            checkoutButton.style.display = 'none'; // Hide checkout if cart is empty
            appliedCoupon = null; // Reset coupon if cart becomes empty
            saveCouponToStorage();
        } else {
            couponInput.disabled = false;
            applyCouponButton.disabled = false;
            checkoutButton.style.display = 'block'; // Show checkout button


            cart.forEach(item => {
                const product = findProductById(item.productId);
                if (product) {
                    const cartItemDiv = document.createElement('div');
                    cartItemDiv.classList.add('cart-item');
                    cartItemDiv.innerHTML = `
                        <div class="cart-item-details">
                            <span>${product.name}</span>
                             <span class="item-price">$${product.price.toFixed(2)} ea.</span>
                        </div>
                        <div class="cart-item-actions">
                            <input type="number" class="cart-quantity-input" value="${item.quantity}" min="1" data-product-id="${product.id}" aria-label="Quantity for ${product.name}">
                            <button class="remove-item" data-product-id="${product.id}">&times;</button>
                        </div>
                    `;
                    cartItemsDiv.appendChild(cartItemDiv);
                } else {
                    
                    console.warn(`Product with ID ${item.productId} not found for cart item.`);
                     
                }
            });
        }

        // Update totals display
        const { subtotal, discount, total } = calculateTotals();
        subtotalSpan.textContent = subtotal.toFixed(2);
        discountSpan.textContent = discount.toFixed(2);
        totalSpan.textContent = total.toFixed(2);

         // Update coupon input field based on applied coupon state
         if(appliedCoupon) {
            couponInput.value = appliedCoupon;
            couponInput.disabled = true; // Optionally disable after successful apply
            applyCouponButton.textContent = "Applied"; // Change button text
            applyCouponButton.disabled = true;
         } else {
             couponInput.value = ''; // Clear if no coupon applied
             couponInput.disabled = cart.length === 0; // Disable if cart empty
             applyCouponButton.textContent = "Apply Coupon";
             applyCouponButton.disabled = cart.length === 0;
         }

         // Enable/disable checkout button based on cart content
         checkoutButton.disabled = cart.length === 0;
    }

    function applyCoupon() {
        const code = couponInput.value.trim(); // Trim whitespace

       

        if (cart.length === 0) {
             showMessage('Cannot apply coupon to an empty cart.', 'error');
             return;
        }


        if (code === VALID_COUPON_CODE) {
            if (appliedCoupon === VALID_COUPON_CODE) {
                showMessage('Coupon already applied.', 'info');
            } else {
                appliedCoupon = code;
                saveCouponToStorage();
                renderCart(); // Re-render to show discount
                showMessage(`Coupon "${code}" applied! 10% discount.`, 'success');
            }
        } else if (code === '') {
             showMessage('Please enter a coupon code.', 'error');
        }
         else {
            
            showMessage(`Invalid coupon code: "${code}".`, 'error');
            couponInput.value = ''; // Clear the invalid code
        }
    }

    // Persistence Functions

    function saveCartToStorage() {
        localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    }

    function loadCartFromStorage() {
        const savedCart = localStorage.getItem(STORAGE_KEY_CART);
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                
                if (Array.isArray(parsedCart)) {
                    cart = parsedCart.filter(item =>
                        typeof item.productId === 'number' &&
                        typeof item.quantity === 'number' &&
                        item.quantity > 0 // Ensure quantity is positive
                    );
                } else {
                    console.warn("Invalid cart data found in localStorage. Resetting cart.");
                    cart = [];
                }
            } catch (e) {
                console.error("Error parsing cart data from localStorage:", e);
                cart = []; // Reset cart on parsing error
            }
        } else {
            cart = []; // Initialize empty if there's nothing in storage
        }
    }

     function saveCouponToStorage() {
        if (appliedCoupon) {
            localStorage.setItem(STORAGE_KEY_COUPON, appliedCoupon);
        } else {
            localStorage.removeItem(STORAGE_KEY_COUPON); 
        }
    }

    function loadCouponFromStorage() {
        const savedCoupon = localStorage.getItem(STORAGE_KEY_COUPON);
         // prevents loading old/invalid codes
        if (savedCoupon === VALID_COUPON_CODE) {
             appliedCoupon = savedCoupon;
        } else {
             appliedCoupon = null; 
             localStorage.removeItem(STORAGE_KEY_COUPON); 
        }

    }


    // Message Handling
    let messageTimeout;
    function showMessage(message, type = 'info') { 
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`; 

        // Clear previous timeout if exists
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }

        // Hide message after 5 seconds
        messageTimeout = setTimeout(() => {
            hideMessage();
        }, 5000);
    }

    function hideMessage() {
         messageDiv.textContent = '';
         messageDiv.className = 'message'; 
          if (messageTimeout) {
            clearTimeout(messageTimeout);
            messageTimeout = null;
        }
    }

    // Event Listeners 

    // Product List Clicks 
    productListDiv.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart')) {
            const productId = event.target.dataset.productId;
            addToCart(productId);
        }
    });

    // Cart Items Clicks/Changes 
    cartItemsDiv.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item')) {
            const productId = event.target.dataset.productId;
            removeFromCart(productId);
        }
    });

    cartItemsDiv.addEventListener('change', (event) => {
        if (event.target.classList.contains('cart-quantity-input')) {
            const productId = event.target.dataset.productId;
            const newQuantity = event.target.value; 
             
             if (!isNaN(newQuantity) && Number(newQuantity) >= 0) { 
                 updateQuantity(productId, newQuantity);
             } else {
                 
                  showMessage('Invalid quantity entered.', 'error');
                 // Find the current quantity in the cart and reset the input field
                  const item = cart.find(i => i.productId === Number(productId));
                 if (item) {
                     event.target.value = item.quantity; 
                 } else {
                     event.target.value = 1; 
                 }
             }
        }
    });
     // Prevent non-numeric input in quantity fields (optional but good UX)
    cartItemsDiv.addEventListener('input', (event) => {
        if (event.target.classList.contains('cart-quantity-input')) {
             event.target.value = event.target.value.replace(/[^0-9]/g, '');
        }
    });


    // Apply Coupon Button Click
    applyCouponButton.addEventListener('click', applyCoupon);

    // (Optional) Checkout Button Click
    checkoutButton.addEventListener('click', () => {
        if(cart.length > 0) {
             alert(`Proceeding to checkout with ${cart.length} item(s)! Total: $${totalSpan.textContent}\n(This is a mock action - a real checkout page would load here)`);
             
        } else {
             showMessage('Cannot checkout with an empty cart.', 'error');
        }
    });

}); 