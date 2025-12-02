/* ============================================
   HERBAL WELLNESS STORE - ANIMATIONS
   Three.js Hero Background & Scroll Effects
   ============================================ */

// ============================================
// THREE.JS HERO BACKGROUND
// ============================================
function initHeroAnimation() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    camera.position.z = 5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x5A8F69, 0.8);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xD4A574, 1, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Particle system
    const particles = [];
    const particleCount = window.innerWidth < 768 ? 100 : 250;
    
    // Create leaf-like particles
    const leafGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const leafMaterial = new THREE.MeshStandardMaterial({
        color: 0x5A8F69,
        transparent: true,
        opacity: 0.6,
        emissive: 0x2D5F3F,
        emissiveIntensity: 0.2
    });

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(leafGeometry, leafMaterial.clone());
        
        // Random position
        particle.position.x = (Math.random() - 0.5) * 10;
        particle.position.y = (Math.random() - 0.5) * 10;
        particle.position.z = (Math.random() - 0.5) * 10;
        
        // Random scale
        const scale = Math.random() * 0.5 + 0.5;
        particle.scale.set(scale, scale, scale);
        
        // Random rotation
        particle.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Store animation properties
        particle.userData = {
            speedX: (Math.random() - 0.5) * 0.002,
            speedY: (Math.random() - 0.5) * 0.002,
            speedZ: (Math.random() - 0.5) * 0.002,
            rotationSpeed: (Math.random() - 0.5) * 0.01,
            floatSpeed: Math.random() * 0.001 + 0.001,
            floatAmplitude: Math.random() * 0.3 + 0.1
        };
        
        particles.push(particle);
        scene.add(particle);
    }

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    document.addEventListener('mousemove', (event) => {
        targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Smooth mouse follow
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
        
        // Update particles
        particles.forEach((particle, index) => {
            const userData = particle.userData;
            const time = Date.now() * 0.001;
            
            // Floating animation
            particle.position.y += Math.sin(time * userData.floatSpeed + index) * userData.floatAmplitude * 0.01;
            
            // Continuous movement
            particle.position.x += userData.speedX;
            particle.position.z += userData.speedZ;
            
            // Rotation
            particle.rotation.x += userData.rotationSpeed;
            particle.rotation.y += userData.rotationSpeed * 0.5;
            particle.rotation.z += userData.rotationSpeed * 0.3;
            
            // Mouse parallax effect (subtle)
            particle.position.x += mouseX * 0.01;
            particle.position.y += mouseY * 0.01;
            
            // Boundary check - reset if too far
            if (particle.position.x > 5) particle.position.x = -5;
            if (particle.position.x < -5) particle.position.x = 5;
            if (particle.position.y > 5) particle.position.y = -5;
            if (particle.position.y < -5) particle.position.y = 5;
            if (particle.position.z > 5) particle.position.z = -5;
            if (particle.position.z < -5) particle.position.z = 5;
        });
        
        // Camera subtle movement based on mouse
        camera.position.x = mouseX * 0.3;
        camera.position.y = mouseY * 0.3;
        camera.lookAt(scene.position);
        
        renderer.render(scene, camera);
    }
    
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ============================================
// GSAP SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    
    // Parallax effect on benefits section background
    gsap.to('.benefits-parallax', {
        scrollTrigger: {
            trigger: '.benefits-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
        },
        y: -100,
        ease: 'none'
    });
    
    // Product cards stagger animation
    gsap.from('.product-card', {
        scrollTrigger: {
            trigger: '.products-section',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out'
    });
}

// ============================================
// COUNTER ANIMATION
// ============================================
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + '+';
        }
    };
    
    updateCounter();
}

// Observe counter elements
function initCounterAnimations() {
    const counters = document.querySelectorAll('.counter');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                animateCounter(entry.target);
                entry.target.classList.add('counted');
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

// ============================================
// SMOOTH SCROLL
// ============================================
function scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

// Make function globally available
window.scrollToProducts = scrollToProducts;

// ============================================
// INITIALIZE AOS
// ============================================
function initAOS() {
    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 100,
        delay: 0
    });
}

// ============================================
// INITIALIZE ALL ANIMATIONS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Three.js background
    initHeroAnimation();
    
    // Initialize GSAP animations
    initScrollAnimations();
    
    // Initialize AOS
    initAOS();
    
    // Initialize counter animations
    initCounterAnimations();
});