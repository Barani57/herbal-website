/* ============================================
   HERBAL WELLNESS STORE - MAIN APPLICATION
   Product Data & App Initialization
   ============================================ */

// ============================================
// PRODUCT DATA
// ============================================
const products = [
    {
        id: 'skin-glow',
        name: 'Skin Glow Herbal Powder',
        description: 'Traditional ayurvedic blend for radiant, healthy skin. Made with turmeric, sandalwood, and rose petals.',
        image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&h=600&fit=crop&q=80',
        benefits: [
            { icon: 'fa-sparkles', text: 'Brightens skin tone' },
            { icon: 'fa-shield-halved', text: 'Reduces blemishes' },
            { icon: 'fa-leaf', text: 'Anti-aging properties' }
        ],
        ingredients: ['Turmeric', 'Sandalwood', 'Rose Petals', 'Neem'],
        usage: 'Mix with water or milk to form a paste. Apply on face for 15 minutes. Rinse with lukewarm water.',
        sizes: [
            { size: '50g', price: 199, sku: 'SG-50' },
            { size: '100g', price: 349, sku: 'SG-100' },
            { size: '250g', price: 799, sku: 'SG-250' }
        ]
    },
    {
        id: 'hair-health',
        name: 'Hair Health Herbal Powder',
        description: 'Nourishing herbal formula for strong, lustrous hair. Combines amla, shikakai, and bhringraj.',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop&q=80',
        benefits: [
            { icon: 'fa-seedling', text: 'Promotes hair growth' },
            { icon: 'fa-dumbbell', text: 'Strengthens roots' },
            { icon: 'fa-sparkles', text: 'Adds natural shine' }
        ],
        ingredients: ['Amla', 'Shikakai', 'Bhringraj', 'Fenugreek'],
        usage: 'Mix with water to make a paste. Apply to scalp and hair. Leave for 30 minutes. Wash thoroughly.',
        sizes: [
            { size: '50g', price: 249, sku: 'HH-50' },
            { size: '100g', price: 449, sku: 'HH-100' },
            { size: '250g', price: 999, sku: 'HH-250' }
        ]
    },
    {
        id: 'wellness-mix',
        name: 'Wellness Herbal Mix',
        description: 'Daily wellness booster with ashwagandha, moringa, and tulsi for immunity and vitality.',
        image: 'https://images.unsplash.com/photo-1599940778384-1e9e1cf23f42?w=600&h=600&fit=crop&q=80',
        benefits: [
            { icon: 'fa-shield-heart', text: 'Boosts immunity' },
            { icon: 'fa-heart-pulse', text: 'Improves digestion' },
            { icon: 'fa-bolt', text: 'Increases energy' }
        ],
        ingredients: ['Ashwagandha', 'Moringa', 'Tulsi', 'Ginger'],
        usage: 'Mix 1 teaspoon in warm water or milk. Consume daily before breakfast.',
        sizes: [
            { size: '100g', price: 299, sku: 'WM-100' },
            { size: '250g', price: 649, sku: 'WM-250' },
            { size: '500g', price: 1199, sku: 'WM-500' }
        ]
    }
];

// ============================================
// RENDER PRODUCTS
// ============================================
function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    container.innerHTML = products.map(product => {
        const defaultSize = product.sizes[0];
        
        return `
            <div class="col-12 col-md-6 col-lg-4" data-aos="fade-up" data-aos-duration="800">
                <div class="product-card">
                    <div class="product-image-container">
                        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                        <div class="product-badge">100% Natural</div>
                    </div>
                    
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        
                        <div class="product-benefits">
                            ${product.benefits.map(benefit => `
                                <span class="benefit-tag">
                                    <i class="fas ${benefit.icon}"></i>
                                    ${benefit.text}
                                </span>
                            `).join('')}
                        </div>
                        
                        <div class="product-sizes">
                            <label>Select Size:</label>
                            <div class="size-options">
                                ${product.sizes.map((size, index) => `
                                    <div class="size-option">
                                        <input 
                                            type="radio" 
                                            name="size-${product.id}" 
                                            id="size-${product.id}-${index}" 
                                            value="${size.size}"
                                            ${index === 0 ? 'checked' : ''}
                                            data-price="${size.price}"
                                        >
                                        <label for="size-${product.id}-${index}" class="size-label">
                                            <span class="size-text">${size.size}</span>
                                            <span class="size-price">₹${size.price}</span>
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="quantity-selector">
                            <label>Quantity:</label>
                            <div class="quantity-controls">
                                <button class="qty-btn" onclick="updateQuantity('${product.id}', -1)" aria-label="Decrease quantity">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input 
                                    type="number" 
                                    id="qty-${product.id}" 
                                    class="qty-input" 
                                    value="1" 
                                    min="1" 
                                    max="10"
                                    readonly
                                >
                                <button class="qty-btn" onclick="updateQuantity('${product.id}', 1)" aria-label="Increase quantity">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        
                        <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                            <i class="fas fa-cart-plus"></i>
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// QUANTITY CONTROLS
// ============================================
function updateQuantity(productId, delta) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    if (!qtyInput) return;

    let currentQty = parseInt(qtyInput.value);
    let newQty = currentQty + delta;

    // Enforce min/max limits
    if (newQty < 1) newQty = 1;
    if (newQty > 10) newQty = 10;

    qtyInput.value = newQty;
}

// ============================================
// ADD TO CART
// ============================================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Get selected size
    const sizeRadio = document.querySelector(`input[name="size-${productId}"]:checked`);
    const selectedSize = sizeRadio ? sizeRadio.value : product.sizes[0].size;

    // Get quantity
    const qtyInput = document.getElementById(`qty-${productId}`);
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

    // Add to cart
    if (window.cart) {
        window.cart.addItem(product, selectedSize, quantity);
        
        // Visual feedback
        const button = document.querySelector(`button[onclick="addToCart('${productId}')"]`);
        if (button) {
            const originalHTML = button.innerHTML;
            button.classList.add('added');
            button.innerHTML = '<i class="fas fa-check"></i><span>Added!</span>';
            
            setTimeout(() => {
                button.classList.remove('added');
                button.innerHTML = originalHTML;
            }, 1500);
        }
    }
}

// Make functions globally available
window.updateQuantity = updateQuantity;
window.addToCart = addToCart;

// ============================================
// INITIALIZE APP
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Render products
    renderProducts();
    
    console.log('==============================================');
    console.log('HERBAL WELLNESS STORE - READY');
    console.log('==============================================');
    console.log('SETUP INSTRUCTIONS:');
    console.log('');
    console.log('1. RAZORPAY SETUP:');
    console.log('   - Sign up at https://razorpay.com');
    console.log('   - Get API keys from Dashboard');
    console.log('   - Replace YOUR_RAZORPAY_KEY_ID in js/payment.js');
    console.log('   - Test credentials:');
    console.log('     UPI: success@razorpay');
    console.log('     Card: 4111 1111 1111 1111');
    console.log('');
    console.log('2. EMAILJS SETUP:');
    console.log('   - Sign up at https://www.emailjs.com');
    console.log('   - Create email service (Gmail)');
    console.log('   - Create email template');
    console.log('   - Replace YOUR_SERVICE_ID, YOUR_TEMPLATE_ID,');
    console.log('     and YOUR_PUBLIC_KEY in js/payment.js');
    console.log('');
    console.log('3. DEPLOYMENT:');
    console.log('   - Test locally first');
    console.log('   - Deploy to any static hosting');
    console.log('   - Update with live Razorpay keys');
    console.log('==============================================');
});