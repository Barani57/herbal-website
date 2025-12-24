// Mobile menu toggle
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

// Close menu on link click
document.querySelectorAll('.mobile-nav-link, .mobile-menu-cta a').forEach(link => {
    link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            window.scrollTo({
                top: target.offsetTop - headerHeight,
                behavior: 'smooth'
            });
        }
    });
});

// Cart badge
const cartBadge = document.getElementById('cartBadge');

function updateCart(count) {
    cartBadge.textContent = count;
    cartBadge.classList.toggle('show', count > 0);
}

// Hide scroll hint on scroll
const scrollHint = document.querySelector('.scroll-hint');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        scrollHint.style.opacity = '0';
    }
}, { passive: true });


// Count-up animation for stats when section enters viewport
const statsSection = document.getElementById('quickStats');
const statValues = document.querySelectorAll('#quickStats .stat-value');
let statsAnimated = false;

function animateStats() {
    statValues.forEach(el => {
        const target = parseInt(el.getAttribute('data-target'), 10);
        const duration = 1500; // ms
        const startTime = performance.now();

        function update(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = Math.floor(eased * target);
            el.textContent = current;
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target; // ensure final value
            }
        }

        requestAnimationFrame(update);
    });
}

// Use IntersectionObserver to trigger on scroll
if ('IntersectionObserver' in window && statsSection) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !statsAnimated) {
                statsAnimated = true;
                animateStats();
                observer.unobserve(statsSection);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(statsSection);
}


//************************************************************************** */ product section ************************************

// PRODUCTS DATA
// const products = [
//     {
//         id: 'skin-glow',
//         name: 'Skin Glow Herbal Powder',
//         description: 'Traditional ayurvedic blend for radiant, healthy skin. Made with turmeric, sandalwood, and rose petals.',
//         image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&h=600&fit=crop&q=80',
//         benefits: [
//             { icon: 'fa-sparkles', text: 'Brightens skin tone' },
//             { icon: 'fa-shield-halved', text: 'Reduces blemishes' },
//             { icon: 'fa-leaf', text: 'Anti-aging properties' }
//         ],
//         ingredients: ['Turmeric', 'Sandalwood', 'Rose Petals', 'Neem'],
//         usage: 'Mix with water or milk to form a paste. Apply on face for 15 minutes. Rinse with lukewarm water.',
//         sizes: [
//             { size: '50g', price: 199, sku: 'SG-50' },
//             { size: '100g', price: 349, sku: 'SG-100' },
//             { size: '250g', price: 799, sku: 'SG-250' }
//         ]
//     },
//     {
//         id: 'hair-health',
//         name: 'Hair Health Herbal Powder',
//         description: 'Nourishing herbal formula for strong, lustrous hair. Combines amla, shikakai, and bhringraj.',
//         image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop&q=80',
//         benefits: [
//             { icon: 'fa-seedling', text: 'Promotes hair growth' },
//             { icon: 'fa-dumbbell', text: 'Strengthens roots' },
//             { icon: 'fa-sparkles', text: 'Adds natural shine' }
//         ],
//         ingredients: ['Amla', 'Shikakai', 'Bhringraj', 'Fenugreek'],
//         usage: 'Mix with water to make a paste. Apply to scalp and hair. Leave for 30 minutes. Wash thoroughly.',
//         sizes: [
//             { size: '50g', price: 249, sku: 'HH-50' },
//             { size: '100g', price: 449, sku: 'HH-100' },
//             { size: '250g', price: 999, sku: 'HH-250' }
//         ]
//     },
//     {
//         id: 'wellness-mix',
//         name: 'Wellness Herbal Mix',
//         description: 'Daily wellness booster with ashwagandha, moringa, and tulsi for immunity and vitality.',
//         image: 'https://images.unsplash.com/photo-1516715043227-1cdf27bcd09a?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
//         benefits: [
//             { icon: 'fa-shield-heart', text: 'Boosts immunity' },
//             { icon: 'fa-heart-pulse', text: 'Improves digestion' },
//             { icon: 'fa-bolt', text: 'Increases energy' }
//         ],
//         ingredients: ['Ashwagandha', 'Moringa', 'Tulsi', 'Ginger'],
//         usage: 'Mix 1 teaspoon in warm water or milk. Consume daily before breakfast.',
//         sizes: [
//             { size: '100g', price: 299, sku: 'WM-100' },
//             { size: '250g', price: 649, sku: 'WM-250' },
//             { size: '500g', price: 1199, sku: 'WM-500' }
//         ]
//     },

//     {
//         id: 'herbal-hair-oil',
//         name: 'Herbal Hair Oil',
//         description: 'Natural blend for hair growth, scalp nourishment, and reduced hair fall.',
//         image: 'assets/images/HairOil.png',
//         benefits: [
//             { icon: 'fa-leaf', text: 'Promotes hair growth' },
//             { icon: 'fa-droplet', text: 'Deep scalp ' },
//         ],
//         ingredients: ['Coconut Oil', 'Castor Oil', 'Amla', 'Bhringraj', 'Fenugreek'],
//         usage: 'Apply a small amount to the scalp and massage gently. Leave for 1 hour before washing.',
//         sizes: [
//             { size: '100ml', price: 249, sku: 'HO-100' },
//             { size: '200ml', price: 399, sku: 'HO-200' }
//         ]
//     },
//     {
//         id: 'herbal-hair-pack',
//         name: 'Herbal Hair Pack',
//         description: 'Strengthening herbal formulation for smooth, shiny, and strong hair.',
//         image: 'assets/images/HairPack.png',
//         benefits: [
//             { icon: 'fa-leaf', text: 'Strengthens hair roots' },
//             { icon: 'fa-sparkles', text: 'Adds natural shine' },
//             { icon: 'fa-droplet', text: 'Reduces dandruff' }
//         ],
//         ingredients: ['Amla', 'Shikakai', 'Brahmi', 'Reetha'],
//         usage: 'Mix with water or curd and apply to scalp and hair. Leave for 20 minutes.',
//         sizes: [
//             { size: '100g', price: 249, sku: 'HP-100' }
//         ]
//     },
//     {
//         id: 'herbal-hair-dye',
//         name: 'Herbal Hair Dye',
//         description: 'Chemical-free natural hair dye for dark and healthy hair.',
//         image: 'assets/images/HairPack.png',
//         benefits: [
//             { icon: 'fa-palette', text: 'Natural coloring' },
//             { icon: 'fa-shield-heart', text: 'No chemicals' },
//             { icon: 'fa-leaf', text: 'Strengthens the hair' }
//         ],
//         ingredients: ['Henna', 'Indigo', 'Amla', 'Bhringraj'],
//         usage: 'Mix with warm water, apply evenly to hair, and leave for 1–2 hours.',
//         sizes: [
//             { size: '100g', price: 299, sku: 'HD-100' }
//         ]
//     },
//     {
//         id: 'nalangu-maavu-male',
//         name: 'Nalangu Maavu (Male)',
//         description: 'Traditional herbal bath powder for men—skin cleansing, freshness, and glow.',
//         image: 'assets/images/NalanguMaavu_Male.png',
//         benefits: [
//             { icon: 'fa-sun', text: 'Removes tan' },
//             { icon: 'fa-leaf', text: 'Chemical-free skin' },
//         ],
//         ingredients: ['Green Gram', 'Wild Turmeric', 'Rose Petal Powder', 'Kasturi Manjal'],
//         usage: 'Mix with water or milk and apply all over the body. Rinse after 5 minutes.',
//         sizes: [
//             { size: '100g', price: 169, sku: 'NM-M-100' },
//             { size: '250g', price: 299, sku: 'NM-M-250' }
//         ]
//     },
//     {
//         id: 'nalangu-maavu-female',
//         name: 'Nalangu Maavu (Female)',
//         description: 'Ayurvedic herbal bath powder for glowing, soft, and healthy skin.',
//         image: 'assets/images/NalanguMaavu_Female.png',
//         benefits: [
//             { icon: 'fa-sparkles', text: 'Enhances glow' },
//             { icon: 'fa-flower', text: 'Softens skin' },
//             { icon: 'fa-leaf', text: '100% natural ingredients' }
//         ],
//         ingredients: ['Wild Turmeric', 'Rose', 'Green Gram', 'Sandalwood'],
//         usage: 'Mix with rose water/milk and apply on body. Wash after 5 minutes.',
//         sizes: [
//             { size: '100g', price: 125, sku: 'NM-F-100' },
//             { size: '250g', price: 250, sku: 'NM-F-250' },
//             { size: '500g', price: 450, sku: 'NM-F-500' },
//             { size: '1kg', price: 800, sku: 'NM-F-1K' }
//         ]
//     }
// ];

// PRODUCTS DATA - UPDATED WITH 4 PRODUCTS
const products = [
    {
        id: 'hair-oil',
        name: 'Herbal Hair Oil',
        category: 'oil',
        description: 'Natural blend for hair growth, scalp nourishment, and reduced hair fall.',
        images: [
            'assets/images/hair-oil-1.webp',
            'assets/images/hair-oil-2.webp',
            'assets/images/hair-oil-3.webp'
        ],
        benefits: [
            { icon: 'fa-leaf', text: 'Promotes hair growth' },
            { icon: 'fa-droplet', text: 'Deep scalp nourishment' }
        ],
        ingredients: ['Coconut Oil', 'Castor Oil', 'Amla', 'Bhringraj', 'Fenugreek'],
        usage: 'Apply a small amount to the scalp and massage gently. Leave for 1 hour before washing.',
        sizes: [
            { size: '100ml', price: 249, sku: 'HO-100' },
            { size: '200ml', price: 399, sku: 'HO-200' }
        ]
    },
    {
        id: 'hair-growth-pack',
        name: 'Hair Growth Pack',
        category: 'powder',
        description: 'Strengthening herbal formulation for smooth, shiny, and strong hair.',
        images: [
            'assets/images/hair-growth-1.webp',
            'assets/images/hair-growth-2.webp',
            'assets/images/hair-growth-3.webp'
        ],
        benefits: [
            { icon: 'fa-leaf', text: 'Strengthens hair roots' },
            { icon: 'fa-sparkles', text: 'Adds natural shine' },
            { icon: 'fa-droplet', text: 'Reduces dandruff' }
        ],
        ingredients: ['Amla', 'Shikakai', 'Brahmi', 'Reetha'],
        usage: 'Mix with water or curd and apply to scalp and hair. Leave for 20 minutes.',
        sizes: [
            { size: '100g', price: 249, sku: 'HGP-100' }
        ]
    },
    {
        id: 'hair-dye',
        name: 'Herbal Hair Dye',
        category: 'powder',
        description: 'Chemical-free natural hair dye for dark and healthy hair.',
        images: [
            'assets/images/hair-dye-1.webp',
            'assets/images/hair-dye-2.webp',
            'assets/images/hair-dye-3.webp'
        ],
        benefits: [
            { icon: 'fa-palette', text: 'Natural coloring' },
            { icon: 'fa-shield-heart', text: 'No chemicals' },
            { icon: 'fa-leaf', text: 'Strengthens hair' }
        ],
        ingredients: ['Henna', 'Indigo', 'Amla', 'Bhringraj'],
        usage: 'Mix with warm water, apply evenly to hair, and leave for 1–2 hours.',
        sizes: [
            { size: '100g', price: 299, sku: 'HD-100' }
        ]
    },
    {
    id: 'nalangu-maavu-male',
    name: 'Nalangu Maavu (Male)',
    category: 'powder',
    description: 'Traditional herbal bath powder for men—skin cleansing, freshness, and natural glow.',
    images: [
        'assets/images/nalangu-mavu-1.webp',
        'assets/images/nalangu-mavu-2.webp',
        'assets/images/nalangu-mavu-3.webp'
    ],
    benefits: [
        { icon: 'fa-sun', text: 'Removes tan' },
        { icon: 'fa-sparkles', text: 'Enhances glow' },
        { icon: 'fa-leaf', text: '100% natural' }
    ],
    ingredients: ['Green Gram', 'Wild Turmeric', 'Rose Petal', 'Sandalwood'],
    usage: 'Mix with water or milk and apply all over the body. Rinse after 5 minutes.',
    sizes: [
        { size: '100g', price: 10, sku: 'NM-M-100' },
        { size: '250g', price: 299, sku: 'NM-M-250' }
    ]
},
{
    id: 'nalangu-maavu-female',
    name: 'Nalangu Maavu (Female)',
    category: 'powder',
    description: 'Traditional herbal bath powder for women—skin cleansing, freshness, and natural glow.',
    images: [
        'assets/images/nalangu-mavu-1.webp',
        'assets/images/nalangu-mavu-2.webp',
        'assets/images/nalangu-mavu-3.webp'
    ],
    benefits: [
        { icon: 'fa-sun', text: 'Removes tan' },
        { icon: 'fa-sparkles', text: 'Enhances glow' },
        { icon: 'fa-leaf', text: '100% natural' }
    ],
    ingredients: ['Green Gram', 'Wild Turmeric', 'Rose Petal', 'Sandalwood'],
    usage: 'Mix with water or milk and apply all over the body. Rinse after 5 minutes.',
    sizes: [
        { size: '100g', price: 169, sku: 'NM-F-100' },
        { size: '250g', price: 299, sku: 'NM-F-250' },
        { size: '500g', price: 599, sku: 'NM-F-500' },
        { size: '1kg', price: 999, sku: 'NM-F-1K' }
    ]
}
];
// Active category filter
let activeCategory = 'all';

// Local storage helpers
const CART_KEY = 'aazhi_cart';

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Render products
const productsGrid = document.getElementById('productsGrid');
const floatingCartBtn = document.getElementById('floatingCartBtn');
const floatingCartCount = document.getElementById('floatingCartCount');

// function renderProducts() {
//     if (!productsGrid) return;

//     productsGrid.innerHTML = products
//         .map((product, index) => {
//             const basePrice = product.sizes[0].price;
//             const tagText = index < 2 ? 'Best seller' : 'New';

//             return `
//         <article class="product-card" data-product-id="${product.id}">
//           <div class="product-image-wrap">
//             <img src="${product.image}" alt="${product.name}" loading="lazy" class="product-image" />
//             <div class="product-tag">
//               <i class="fa-solid fa-crown"></i>
//               <span>${tagText}</span>
//             </div>
//           </div>
//           <div class="product-body">
//             <h3 class="product-name">${product.name}</h3>
//             <p class="product-description">${product.description}</p>
            
//             <div class="product-benefits">
//               ${product.benefits
//                     .map(
//                         (b) => `
//                 <span class="benefit-pill">
//                   <i class="fa-solid ${b.icon}"></i>
//                   <span>${b.text}</span>
//                 </span>
//               `
//                     )
//                     .join('')}
//             </div>

//             <div class="product-footer">
//               <div class="size-selector">
//                 ${product.sizes
//                     .map(
//                         (s, i) => `
//                   <button 
//                     class="size-pill ${i === 0 ? 'active' : ''}" 
//                     data-size="${s.size}" 
//                     data-price="${s.price}">
//                     ${s.size}
//                   </button>
//                 `
//                     )
//                     .join('')}
//               </div>
//               <div class="product-price-group">
//                 <div class="product-price" data-price-display>
//                   ₹${basePrice}<small></small>
//                 </div>
//                 <div class="cart-actions">
//   <button class="btn-add-cart" data-add-to-cart>
//     <i class="fa-solid fa-plus"></i>
//     <span>Add</span>
//   </button>

//   <div class="qty-control" data-qty-control>
//     <button class="qty-btn" data-qty-minus>-</button>
//     <span class="qty-value" data-qty-value>1</span>
//     <button class="qty-btn" data-qty-plus>+</button>
//   </div>
// </div>

//               </div>
//             </div>
//           </div>
//         </article>
//       `;
//         })
//         .join('');

//     attachProductEvents();
// }

// Attach size + add-to-cart handlers

function renderProducts() {
    if (!productsGrid) return;

     const filteredProducts = activeCategory === 'all' 
        ? products 
        : products.filter(p => p.category === activeCategory);

    productsGrid.innerHTML = filteredProducts
        .map((product, index) => {
            const basePrice = product.sizes[0].price;
            const tagText = index === 0 ? 'Best seller' : index === 1 ? 'Popular' : 'New';

            return `
        <article class="product-card" data-product-id="${product.id}">
          <div class="product-image-wrap">
            <div class="product-carousel" data-carousel="${product.id}">
              <div class="carousel-images">
                ${product.images.map((img, idx) => `
                  <img src="${img}" alt="${product.name} ${idx + 1}" loading="lazy" 
                       class="product-image ${idx === 0 ? 'active' : ''}" 
                       data-image-index="${idx}" />
                `).join('')}
              </div>
              <button class="carousel-btn carousel-prev" data-carousel-prev aria-label="Previous image">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              <button class="carousel-btn carousel-next" data-carousel-next aria-label="Next image">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
              <div class="carousel-dots">
                ${product.images.map((_, idx) => `
                  <span class="carousel-dot ${idx === 0 ? 'active' : ''}" data-dot-index="${idx}"></span>
                `).join('')}
              </div>
            </div>
            <div class="product-tag">
              <i class="fa-solid fa-crown"></i>
              <span>${tagText}</span>
            </div>
          </div>
          <div class="product-body">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            
            <div class="product-benefits">
              ${product.benefits
                    .map(
                        (b) => `
                <span class="benefit-pill">
                  <i class="fa-solid ${b.icon}"></i>
                  <span>${b.text}</span>
                </span>
              `
                    )
                    .join('')}
            </div>

            <div class="product-footer">
              <div class="size-selector">
                ${product.sizes
                    .map(
                        (s, i) => `
                  <button 
                    class="size-pill ${i === 0 ? 'active' : ''}" 
                    data-size="${s.size}" 
                    data-price="${s.price}">
                    ${s.size}
                  </button>
                `
                    )
                    .join('')}
              </div>
              <div class="product-price-group">
                <div class="product-price" data-price-display>
                  ₹${basePrice}<small></small>
                </div>
                <div class="cart-actions">
                  <button class="btn-add-cart" data-add-to-cart>
                    <i class="fa-solid fa-plus"></i>
                    <span>Add</span>
                  </button>

                  <div class="qty-control" data-qty-control>
                    <button class="qty-btn" data-qty-minus>-</button>
                    <span class="qty-value" data-qty-value>1</span>
                    <button class="qty-btn" data-qty-plus>+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
        })
        .join('');

    attachProductEvents();
    initializeCarousels();
}

// ============= PRODUCT CAROUSEL FUNCTIONALITY =============
const carouselIntervals = new Map();

function initializeCarousels() {
    document.querySelectorAll('[data-carousel]').forEach(carousel => {
        const productId = carousel.getAttribute('data-carousel');
        const images = carousel.querySelectorAll('.product-image');
        const dots = carousel.querySelectorAll('.carousel-dot');
        const prevBtn = carousel.querySelector('[data-carousel-prev]');
        const nextBtn = carousel.querySelector('[data-carousel-next]');
        
        if (images.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            return;
        }

        let currentIndex = 0;

        function showImage(index) {
            images.forEach((img, i) => {
                img.classList.toggle('active', i === index);
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        function nextImage() {
            currentIndex = (currentIndex + 1) % images.length;
            showImage(currentIndex);
        }

        function prevImage() {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            showImage(currentIndex);
        }

        // Manual controls
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            prevImage();
            resetAutoSlide();
        });

        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nextImage();
            resetAutoSlide();
        });

        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = index;
                showImage(currentIndex);
                resetAutoSlide();
            });
        });

        // Auto-slide every 5 seconds
        function startAutoSlide() {
            const interval = setInterval(nextImage, 5000);
            carouselIntervals.set(productId, interval);
        }

        function resetAutoSlide() {
            const existingInterval = carouselIntervals.get(productId);
            if (existingInterval) {
                clearInterval(existingInterval);
            }
            startAutoSlide();
        }

        startAutoSlide();

        // Pause on hover
        carousel.addEventListener('mouseenter', () => {
            const interval = carouselIntervals.get(productId);
            if (interval) clearInterval(interval);
        });

        carousel.addEventListener('mouseleave', () => {
            startAutoSlide();
        });
    });
}

// ============= IMAGE LIGHTBOX FUNCTIONALITY =============
function initializeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    const lightboxClose = document.getElementById('lightboxClose');
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const zoomReset = document.getElementById('zoomReset');
    
    let currentZoom = 1;
    
    // Open lightbox on image click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('product-image') && e.target.classList.contains('active')) {
            lightbox.classList.add('active');
            lightboxImg.src = e.target.src;
            currentZoom = 1;
            lightboxImg.style.transform = `scale(${currentZoom})`;
            document.body.style.overflow = 'hidden';
        }
    });
    
    // Close lightbox
    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Close on backdrop click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Zoom controls
    zoomIn.addEventListener('click', () => {
        currentZoom = Math.min(currentZoom + 0.25, 3);
        lightboxImg.style.transform = `scale(${currentZoom})`;
    });
    
    zoomOut.addEventListener('click', () => {
        currentZoom = Math.max(currentZoom - 0.25, 0.5);
        lightboxImg.style.transform = `scale(${currentZoom})`;
    });
    
    zoomReset.addEventListener('click', () => {
        currentZoom = 1;
        lightboxImg.style.transform = `scale(${currentZoom})`;
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        } else if (e.key === '+') {
            zoomIn.click();
        } else if (e.key === '-') {
            zoomOut.click();
        } else if (e.key === '0') {
            zoomReset.click();
        }
    });
}

// Cleanup intervals when needed
function cleanupCarousels() {
    carouselIntervals.forEach(interval => clearInterval(interval));
    carouselIntervals.clear();
}

// ==================== CATEGORY FILTER FUNCTIONALITY ====================
function initCategoryFilter() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons
            categoryButtons.forEach(b => b.classList.remove('active'));
            
            // Add active to clicked button
            btn.classList.add('active');
            
            // Get category
            activeCategory = btn.getAttribute('data-category');
            
            // Re-render products with filter
            renderProducts();
        });
    });
}

function attachProductEvents() {
    productsGrid.querySelectorAll('.product-card').forEach((card) => {
        const sizeButtons = card.querySelectorAll('.size-pill');
        const priceDisplay = card.querySelector('[data-price-display]');
        const addBtn = card.querySelector('[data-add-to-cart]');
        const qtyControl = card.querySelector('[data-qty-control]');
        const qtyValueEl = card.querySelector('[data-qty-value]');
        const minusBtn = card.querySelector('[data-qty-minus]');
        const plusBtn = card.querySelector('[data-qty-plus]');

        // Size selection
        sizeButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                sizeButtons.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');

                const price = btn.getAttribute('data-price');
                priceDisplay.innerHTML = `₹${price}<small></small>`;

                syncFromCart();
            });
        });


        const productId = card.getAttribute('data-product-id');
        const product = products.find((p) => p.id === productId);

        // Restore state from cart if already added
        // Restore state from cart for currently selected size
        function syncFromCart() {
            const currentSize = getActiveSize(card);
            const existing = getCart().find(
                (item) => item.id === productId && item.size === currentSize
            );

            if (existing) {
                addBtn.style.display = 'none';
                qtyControl.style.display = 'inline-flex';
                qtyValueEl.textContent = existing.quantity;
            } else {
                qtyControl.style.display = 'none';
                addBtn.style.display = 'inline-flex';
                qtyValueEl.textContent = 1;
            }
        }

        syncFromCart();


        // Add to cart → show qty control
        addBtn.addEventListener('click', () => {
            const size = getActiveSize(card);
            const price = getActivePrice(card);
            let cart = getCart();

            const idx = cart.findIndex((it) => it.id === product.id && it.size === size);
            if (idx > -1) {
                cart[idx].quantity += 1;
                qtyValueEl.textContent = cart[idx].quantity;
            } else {
            cart.push({
    id: product.id,
    name: product.name,
    size,
    price,
    quantity: 1,
    image: product.images[0], // First image from carousel
});
                qtyValueEl.textContent = 1;
            }

            saveCart(cart);
            updateFloatingCart(cart.length);
            bumpCartBadge();

            addBtn.style.display = 'none';
            qtyControl.style.display = 'inline-flex';
            renderCartDrawerItems();
        });

        // Plus / minus handlers
        plusBtn.addEventListener('click', () => {
            const size = getActiveSize(card);
            let cart = getCart();
            const idx = cart.findIndex((it) => it.id === product.id && it.size === size);
            if (idx === -1) return;

            cart[idx].quantity += 1;
            qtyValueEl.textContent = cart[idx].quantity;
            saveCart(cart);
            updateFloatingCart(cart.length);
            renderCartDrawerItems();
        });

        minusBtn.addEventListener('click', () => {
            const size = getActiveSize(card);
            let cart = getCart();
            const idx = cart.findIndex((it) => it.id === product.id && it.size === size);
            if (idx === -1) return;

            cart[idx].quantity -= 1;

            if (cart[idx].quantity <= 0) {
                cart.splice(idx, 1);
                qtyControl.style.display = 'none';
                addBtn.style.display = 'inline-flex';
            } else {
                qtyValueEl.textContent = cart[idx].quantity;
            }

            saveCart(cart);
            updateFloatingCart(cart.length);
            renderCartDrawerItems();
        });
    });
}

function getActiveSize(card) {
    const activeSizeBtn = card.querySelector('.size-pill.active') || card.querySelector('.size-pill');
    return activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : '';
}

function getActivePrice(card) {
    const activeSizeBtn = card.querySelector('.size-pill.active') || card.querySelector('.size-pill');
    return activeSizeBtn ? parseInt(activeSizeBtn.getAttribute('data-price'), 10) : 0;
}


// Floating cart visibility / count
function updateFloatingCart(count) {
    if (!floatingCartBtn || !floatingCartCount) return;

    floatingCartCount.textContent = count;
    if (count > 0) {
        floatingCartBtn.classList.add('show');
    } else {
        floatingCartBtn.classList.remove('show');
    }
}

// Small scale animation when adding
function bumpCartBadge() {
    if (!floatingCartBtn) return;
    floatingCartBtn.classList.add('bump');
    setTimeout(() => floatingCartBtn.classList.remove('bump'), 250);
}

// Optional: bump animation via CSS class (ensure this CSS exists)
/*
.floating-cart.bump {
  animation: cartPopIn 0.25s var(--ease-bounce);
}
*/

// On load – render and restore cart count
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    initCategoryFilter();
    initializeLightbox(); // ADD THIS LINE

     const stateSelect = document.getElementById('cartCustomerState');
    
    if (stateSelect) {
        stateSelect.addEventListener('change', () => {
            renderCartDrawerItems(); // Re-render to update delivery
        });
    }

    const cart = getCart();
    updateFloatingCart(cart.length);
});

// Example click handler for opening a cart drawer/modal (you can implement later)
if (floatingCartBtn) {
    floatingCartBtn.addEventListener('click', () => {
        openCartDrawer(); // implement UI as needed
        console.log('Open cart – items:', getCart());
    });
}

document.getElementById('cartBtn').addEventListener("click", () => {openCartDrawer()});


// *********************************************** View card functionality *****************************************************

const cartDrawer = document.getElementById('cartDrawer');
const cartDrawerBackdrop = document.getElementById('cartDrawerBackdrop');
const cartDrawerBody = document.getElementById('cartDrawerBody');
const cartDrawerTotal = document.getElementById('cartDrawerTotal');
const cartDrawerClose = document.getElementById('cartDrawerClose');

// function openCartDrawer() {
//     if (!cartDrawer) return;
//     cartDrawer.classList.add('open');
//     cartDrawerBackdrop.classList.add('show');
//     cartDrawer.setAttribute('aria-hidden', 'false');
//     renderCartDrawerItems();
// }

function openCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.add('open');
    cartDrawerBackdrop.classList.add('show');
    cartDrawer.setAttribute('aria-hidden', 'false');
    renderCartDrawerItems();
    
    // ✅ ADDED: Ensure drawer body is scrolled to top
    setTimeout(() => {
        const body = document.getElementById('cartDrawerBody');
        if (body) body.scrollTop = 0;
    }, 100);
}

function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('open');
    cartDrawerBackdrop.classList.remove('show');
    cartDrawer.setAttribute('aria-hidden', 'true');
}

// Close cart when clicking backdrop
if (cartDrawerBackdrop) {
    cartDrawerBackdrop.addEventListener('click', () => {
        closeCartDrawer();
    });
}

// function renderCartDrawerItems() {
//     if (!cartDrawerBody || !cartDrawerTotal) return;
//     const cart = getCart();
//     // Dynamic delivery based on state (default to TN)
// const selectedState = localStorage.getItem('selectedState') || 'Tamil Nadu';
// const delivery = selectedState === 'Tamil Nadu' ? 5 : 10;

//     if (!cart.length) {
//         cartDrawerBody.innerHTML = '<p style="font-size:0.85rem;color:var(--bark);">Your cart is empty.</p>';
//         cartDrawerTotal.textContent = '₹0';
//         return;
//     }

//     let subtotal = 0;
//     cartDrawerBody.innerHTML = cart.map((item, index) => {
//         const line = item.price * item.quantity;
//         subtotal += line;
//         return `
//       <div class="cart-drawer-item" data-cart-index="${index}">
//         <div class="cart-drawer-item-left">
//           <div class="cart-drawer-thumb">
//             <img src="${item.image}" alt="${item.name}" />
//           </div>
//           <div class="cart-drawer-item-main">
//             <span class="cart-drawer-item-name">${item.name}</span>
//             <span class="cart-drawer-item-meta">${item.size} • ₹${item.price}</span>
//           </div>
//         </div>
//         <div class="cart-drawer-item-right">
//         <button class="drawer-remove" data-drawer-remove>
//             <i class="fa-solid fa-trash-can"></i>
//           </button>
//           <span class="cart-drawer-line">₹${line}</span>
//           <div class="drawer-qty-control">
//             <button class="drawer-qty-btn" data-drawer-minus>-</button>
//             <span class="drawer-qty-value">${item.quantity}</span>
//             <button class="drawer-qty-btn" data-drawer-plus>+</button>
//           </div>
          
          
//         </div>
//       </div>
//     `;
//     }).join('');

//     const total = subtotal + delivery;
//     cartDrawerTotal.textContent = `₹${total}`;

// cartDrawerBody.insertAdjacentHTML('beforeend', `
//     <div class="cart-drawer-summary">
//       <div><span>Subtotal</span><span>₹${subtotal}</span></div>
//       <div><span>Delivery (${selectedState || 'Tamil Nadu'})</span><span>₹${delivery}</span></div>
//     </div>
//   `);

//     attachDrawerItemEvents();
// }

function renderCartDrawerItems() {

      if (!cartDrawerBody || !cartDrawerTotal) return;
    const cart = getCart();

    const customerForm = document.getElementById('cartCustomerForm');
    const upiPayBtn = document.getElementById('upiPayBtn');
    const stateSelect = document.getElementById('cartCustomerState');
    


    if (!cart.length) {
        cartDrawerBody.innerHTML = '<p style="font-size:0.85rem;color:var(--bark);padding:1rem;">Your cart is empty.</p>';
        cartDrawerTotal.textContent = '₹0';
        if (customerForm) customerForm.style.display = 'none';
        if (upiPayBtn) upiPayBtn.style.display = 'none';
        return;
    }

    // ✅ ADDED: Scroll to top when cart opens
    if (cartDrawerBody.scrollTop > 0) {
        cartDrawerBody.scrollTop = 0;
    }

    // Add this near your upiPayBtn event listener
if (document.getElementById('upiPayBtn')) {
    document.getElementById('upiPayBtn').addEventListener('click', () => {
        const name = document.getElementById('cartCustomerName')?.value.trim();
        const email = document.getElementById('cartCustomerEmail')?.value.trim();
        const phone = document.getElementById('cartCustomerPhone')?.value.trim();
        const state = document.getElementById('cartCustomerState')?.value;
        const address = document.getElementById('cartCustomerAddress')?.value.trim();
        const errorDiv = document.getElementById('cartFormError');

        // Validate all fields
        if (!name || !email || !phone || !state || !address) {
            if (errorDiv) {
                errorDiv.textContent = 'Please fill in all required fields';
                errorDiv.classList.add('show');
            }
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            if (errorDiv) {
                errorDiv.textContent = 'Please enter a valid email address';
                errorDiv.classList.add('show');
            }
            return;
        }

        // Validate phone (basic check)
        if (phone.length < 10) {
            if (errorDiv) {
                errorDiv.textContent = 'Please enter a valid phone number';
                errorDiv.classList.add('show');
            }
            return;
        }

        // Clear error if validation passes
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }

        // Proceed to payment (your existing payment handler code here)
        console.log('Validation passed, proceeding to payment...');
        // Call your payment handler here
    });
}

    // Show customer form when cart has items
    if (customerForm) customerForm.style.display = 'block';

    // if (!cartDrawerBody || !cartDrawerTotal) return;
    // const cart = getCart();

    // const customerForm = document.getElementById('cartCustomerForm');
    // const upiPayBtn = document.getElementById('upiPayBtn');
    // const stateSelect = document.getElementById('cartCustomerState');

    // if (!cart.length) {
    //     cartDrawerBody.innerHTML = '<p style="font-size:0.85rem;color:var(--bark);padding:1rem;">Your cart is empty.</p>';
    //     cartDrawerTotal.textContent = '₹0';
    //     if (customerForm) customerForm.style.display = 'none';
    //     if (upiPayBtn) upiPayBtn.style.display = 'none';
    //     return;
    // }

    // // Show customer form when cart has items
    // if (customerForm) customerForm.style.display = 'block';

    let subtotal = 0;
    cartDrawerBody.innerHTML = cart.map((item, index) => {
        const line = item.price * item.quantity;
        subtotal += line;
        return `
      <div class="cart-drawer-item" data-cart-index="${index}">
        <div class="cart-drawer-item-left">
          <div class="cart-drawer-thumb">
            <img src="${item.image}" alt="${item.name}" />
          </div>
          <div class="cart-drawer-item-main">
            <span class="cart-drawer-item-name">${item.name}</span>
            <span class="cart-drawer-item-meta">${item.size} • ₹${item.price}</span>
          </div>
        </div>
        <div class="cart-drawer-item-right">
          <button class="drawer-remove" data-drawer-remove>
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <span class="cart-drawer-line">₹${line}</span>
          <div class="drawer-qty-control">
            <button class="drawer-qty-btn" data-drawer-minus>-</button>
            <span class="drawer-qty-value">${item.quantity}</span>
            <button class="drawer-qty-btn" data-drawer-plus>+</button>
          </div>
        </div>
      </div>
    `;
    }).join('');

    // Get selected state for delivery calculation
    const selectedState = stateSelect ? stateSelect.value : '';
    const delivery = selectedState === 'Tamil Nadu' ? 50 : selectedState ? 100 : 0;

    const total = subtotal + delivery;
    cartDrawerTotal.textContent = `₹${total}`;

    // Show summary
    cartDrawerBody.insertAdjacentHTML('beforeend', `
        <div class="cart-drawer-summary">
          <div><span>Subtotal</span><span>₹${subtotal}</span></div>
          ${selectedState ? `<div><span>Delivery (${selectedState})</span><span>₹${delivery}</span></div>` : ''}
        </div>
      `);

    // Show/hide checkout button based on state selection
    if (upiPayBtn) {
        upiPayBtn.style.display = selectedState ? 'flex' : 'none';
    }

    attachDrawerItemEvents();
}

// Listen for state selection to update delivery
// document.addEventListener('DOMContentLoaded', () => {
//     const stateSelect = document.getElementById('cartCustomerState');
    
//     if (stateSelect) {
//         stateSelect.addEventListener('change', () => {
//             renderCartDrawerItems(); // Re-render to update delivery
//         });
//     }
// });

cartDrawerClose.addEventListener("click", () => {
    closeCartDrawer();
})

function attachDrawerItemEvents() {
  if (!cartDrawerBody) return;

  cartDrawerBody.querySelectorAll('.cart-drawer-item').forEach((row) => {
    const index = parseInt(row.getAttribute('data-cart-index'), 10);
    const minusBtn = row.querySelector('[data-drawer-minus]');
    const plusBtn = row.querySelector('[data-drawer-plus]');
    const removeBtn = row.querySelector('[data-drawer-remove]');

    minusBtn.addEventListener('click', () => {
      let cart = getCart();
      if (!cart[index]) return;
      cart[index].quantity -= 1;

      if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
      }
      saveCart(cart);
      updateFloatingCart(cart.length);
      renderCartDrawerItems();          // re-render drawer
      renderProducts();                 // re-render cards to sync qty/Add
    });

    plusBtn.addEventListener('click', () => {
      let cart = getCart();
      if (!cart[index]) return;
      cart[index].quantity += 1;
      saveCart(cart);
      updateFloatingCart(cart.length);
      renderCartDrawerItems();
      renderProducts();
    });

    removeBtn.addEventListener('click', () => {
      let cart = getCart();
      if (!cart[index]) return;
      cart.splice(index, 1);
      saveCart(cart);
      updateFloatingCart(cart.length);
      renderCartDrawerItems();
      renderProducts();
    });
  });
}


// const upiPayBtn = document.getElementById('upiPayBtn');
// if (upiPayBtn) {
//     upiPayBtn.addEventListener('click', () => {
//         const cart = getCart();
//         const totalText = cartDrawerTotal ? cartDrawerTotal.textContent : '0';
//         console.log('UPI payment clicked, total:', totalText, 'cart:', cart);
//         // integrate UPI flow later
//     });
// }


// ********************************************************** Testimonial Slider ***********************************************

// ==================== 3D TESTIMONIALS SLIDER ====================
const testimonialCards = document.querySelectorAll('.testimonial-3d-card');
const prevTestimonialBtn = document.getElementById('prevTestimonial');
const nextTestimonialBtn = document.getElementById('nextTestimonial');
const dotsContainer = document.getElementById('testimonialDots');

let currentTestimonial = 0;
let testimonialAutoSlide;

function updateTestimonialCards() {
  testimonialCards.forEach((card, index) => {
    card.classList.remove('active', 'prev', 'next');
    
    if (index === currentTestimonial) {
      card.classList.add('active');
    } else if (index === (currentTestimonial + 1) % testimonialCards.length) {
      card.classList.add('next');
    } else if (index === (currentTestimonial - 1 + testimonialCards.length) % testimonialCards.length) {
      card.classList.add('prev');
    }
  });

  updateTestimonialDots();
}

function createTestimonialDots() {
  if (!dotsContainer) return;
  
  testimonialCards.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('testimonial-dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToTestimonial(index));
    dotsContainer.appendChild(dot);
  });
}

function updateTestimonialDots() {
  const dots = dotsContainer.querySelectorAll('.testimonial-dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentTestimonial);
  });
}

function goToTestimonial(index) {
  currentTestimonial = index;
  updateTestimonialCards();
  resetTestimonialAutoSlide();
}

function nextTestimonial() {
  currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
  updateTestimonialCards();
  resetTestimonialAutoSlide();
}

function prevTestimonialSlide() {
  currentTestimonial = (currentTestimonial - 1 + testimonialCards.length) % testimonialCards.length;
  updateTestimonialCards();
  resetTestimonialAutoSlide();
}

function startTestimonialAutoSlide() {
  testimonialAutoSlide = setInterval(nextTestimonial, 4000);
}

function resetTestimonialAutoSlide() {
  clearInterval(testimonialAutoSlide);
  startTestimonialAutoSlide();
}

if (testimonialCards.length > 0) {
  createTestimonialDots();
  updateTestimonialCards();
  startTestimonialAutoSlide();

  if (nextTestimonialBtn) {
    nextTestimonialBtn.addEventListener('click', nextTestimonial);
  }

  if (prevTestimonialBtn) {
    prevTestimonialBtn.addEventListener('click', prevTestimonialSlide);
  }

  // Pause on hover
  const slider3d = document.querySelector('.testimonials-3d-slider');
  if (slider3d) {
    slider3d.addEventListener('mouseenter', () => clearInterval(testimonialAutoSlide));
    slider3d.addEventListener('mouseleave', startTestimonialAutoSlide);
  }
}


// back to top button
// ==================== BACK TO TOP BUTTON ====================
const backToTopBtn = document.getElementById('backToTop');

// Show/hide button on scroll
window.addEventListener('scroll', () => {
  if (window.scrollY > 400) {
    backToTopBtn.classList.add('show');
  } else {
    backToTopBtn.classList.remove('show');
  }
});

// Smooth scroll to top
if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
