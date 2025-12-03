/* ============================================
   HERBAL WELLNESS STORE - SHOPPING CART
   Cart Management & Local Storage
   ============================================ */

class ShoppingCart {
    constructor() {
        this.items = [];
        this.loadFromStorage();
        this.initEventListeners();
        this.updateUI();
    }

    // Load cart from localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('herbalCart');
        if (saved) {
            this.items = JSON.parse(saved);
        }
    }

    // Save cart to localStorage
    saveToStorage() {
        localStorage.setItem('herbalCart', JSON.stringify(this.items));
    }

    // Add item to cart
    addItem(product, size, quantity) {
        const existingItem = this.items.find(
            item => item.id === product.id && item.size === size
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                image: product.image,
                size: size,
                price: this.getPrice(product, size),
                quantity: quantity
            });
        }

        this.saveToStorage();
        this.updateUI();
        this.showAddedFeedback();
    }

    // Get price for specific size
    getPrice(product, size) {
        const sizeObj = product.sizes.find(s => s.size === size);
        return sizeObj ? sizeObj.price : 0;
    }

    // Update item quantity
    updateQuantity(index, delta) {
        if (this.items[index]) {
            this.items[index].quantity += delta;
            
            if (this.items[index].quantity <= 0) {
                this.removeItem(index);
            } else {
                this.saveToStorage();
                this.updateUI();
            }
        }
    }

    // Remove item from cart
    removeItem(index) {
        this.items.splice(index, 1);
        this.saveToStorage();
        this.updateUI();
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    // Get total items count
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    // Clear cart
    clear() {
        this.items = [];
        this.saveToStorage();
        this.updateUI();
    }

    // Update UI
    updateUI() {
        this.updateBadge();
        this.updateCartSidebar();
    }

    // Update cart badge
    updateBadge() {
        const badge = document.getElementById('cartBadge');
        const count = this.getItemCount();
        
        if (badge) {
            badge.textContent = count;
            
            // Add bounce animation
            if (count > 0) {
                badge.classList.add('bounce');
                setTimeout(() => badge.classList.remove('bounce'), 500);
            }
        }
    }

    // Update cart sidebar
    updateCartSidebar() {
        const cartItems = document.getElementById('cartItems');
        const cartEmpty = document.getElementById('cartEmpty');
        const cartFooter = document.getElementById('cartFooter');
        const subtotal = document.getElementById('cartSubtotal');

        if (!cartItems) return;

        if (this.items.length === 0) {
            cartEmpty.style.display = 'block';
            cartItems.style.display = 'none';
            cartFooter.style.display = 'none';
        } else {
            cartEmpty.style.display = 'none';
            cartItems.style.display = 'block';
            cartFooter.style.display = 'block';

            // Render cart items
            cartItems.innerHTML = this.items.map((item, index) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-size">${item.size}</div>
                        <div class="cart-item-controls">
                            <div class="cart-qty-controls">
                                <button class="cart-qty-btn" onclick="cart.updateQuantity(${index}, -1)" aria-label="Decrease quantity">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="cart-qty">${item.quantity}</span>
                                <button class="cart-qty-btn" onclick="cart.updateQuantity(${index}, 1)" aria-label="Increase quantity">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="cart-item-price">₹${item.price * item.quantity}</div>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="cart.removeItem(${index})" aria-label="Remove item">
                        <i class="fas fa-xmark"></i>
                    </button>
                </div>
            `).join('');

            // Update subtotal
            if (subtotal) {
                subtotal.textContent = `₹${this.getTotal()}`;
            }
        }
    }

    // Show added to cart feedback
    showAddedFeedback() {
        // You can add a toast notification here
        console.log('Item added to cart');
    }

    // Initialize event listeners
    initEventListeners() {
        // Cart toggle
        const cartFloatBtn = document.getElementById('cartFloatBtn');
        const cartCloseBtn = document.getElementById('cartCloseBtn');
        const cartOverlay = document.getElementById('cartOverlay');
        const cartSidebar = document.getElementById('cartSidebar');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (cartFloatBtn) {
            cartFloatBtn.addEventListener('click', () => {
                cartSidebar.classList.add('active');
                cartOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        const closeCart = () => {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (cartCloseBtn) {
            cartCloseBtn.addEventListener('click', closeCart);
        }

        if (cartOverlay) {
            cartOverlay.addEventListener('click', closeCart);
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                closeCart();
                
                // Open checkout overlay
                const checkoutOverlay = document.getElementById('checkoutOverlay');
                if (checkoutOverlay) {
                    checkoutOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    
                    // Populate order summary
                    if (window.checkout) {
                        window.checkout.updateOrderSummary();
                    }
                }
            });
        }
    }
}

// Initialize cart
const cart = new ShoppingCart();

// Make cart globally available
window.cart = cart;