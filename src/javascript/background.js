const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
let time = 0;

// Performance optimization: reduce resolution for calculations
const RESOLUTION_SCALE = 0.05; // Quarter resolution for calculations
let calcWidth = Math.floor(width * RESOLUTION_SCALE);
let calcHeight = Math.floor(height * RESOLUTION_SCALE);

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    calcWidth = Math.floor(width * RESOLUTION_SCALE);
    calcHeight = Math.floor(height * RESOLUTION_SCALE);
    if (width > 0 && height > 0) {
        updateCircleScale();
    }
});

const NUM_CIRCLES = 12;
let circles = [];

function getScaleFactor() {
    const baseSize = 1000;
    const currentSize = Math.min(width, height);
    return currentSize / baseSize;
}

function createCircles() {
    circles = [];
    const scaleFactor = getScaleFactor();
    const baseRadius = 120 * scaleFactor;
    
    for (let i = 0; i < NUM_CIRCLES; i++) {
        circles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            radius: baseRadius + Math.random() * (60 * scaleFactor),
            baseRadius: baseRadius + Math.random() * (60 * scaleFactor),
            hueOffset: Math.random(),
            // Pre-calculate scaled positions for performance
            scaledX: 0,
            scaledY: 0,
            scaledRadius: 0
        });
    }
}

function updateCircleScale() {
    const scaleFactor = getScaleFactor();
    const baseRadius = 120 * scaleFactor;
    
    for (let circle of circles) {
        const radiusVariation = Math.random() * (60 * scaleFactor);
        circle.radius = baseRadius + radiusVariation;
        circle.baseRadius = baseRadius + radiusVariation;
    }
}

// PARTY COLORS ONLY! 🎉
const THEME_COLORS = [
    [208, 242, 5],   // Electric Slime #D0F205 - NEON GREEN!
    [93, 245, 201],  // Minty Plasma #5DF5C9 - ELECTRIC MINT!
    [255, 59, 129],  // Neon Cherry #FF3B81 - HOT PINK!
    [238, 130, 238], // Violet (from glass effect) - ELECTRIC PURPLE!
    [0, 255, 255],   // Cyan (from glass effect) - LASER BLUE!
];

// Pre-calculate color lookup table for better performance
const COLOR_LUT_SIZE = 256;
let colorLUT = [];

function buildColorLUT() {
    colorLUT = [];
    for (let i = 0; i < COLOR_LUT_SIZE; i++) {
        const phase = i / COLOR_LUT_SIZE;
        const numColors = THEME_COLORS.length;
        
        // Cycle through theme colors with smooth transitions
        const colorIndex = phase * numColors;
        const baseIndex = Math.floor(colorIndex) % numColors;
        const nextIndex = (baseIndex + 1) % numColors;
        const blend = colorIndex - Math.floor(colorIndex);
        
        const baseColor = THEME_COLORS[baseIndex];
        const nextColor = THEME_COLORS[nextIndex];
        
        // Smooth interpolation between colors
        const r = Math.floor(baseColor[0] * (1 - blend) + nextColor[0] * blend);
        const g = Math.floor(baseColor[1] * (1 - blend) + nextColor[1] * blend);
        const b = Math.floor(baseColor[2] * (1 - blend) + nextColor[2] * blend);
        
        colorLUT.push([r, g, b]);
    }
}

function getColor(hueOffset, timeOffset) {
    const colorPhase = ((hueOffset + timeOffset) % 1 + 1) % 1;
    const index = Math.floor(colorPhase * (COLOR_LUT_SIZE - 1));
    return colorLUT[index] || THEME_COLORS[0];
}

function drawMetaballs() {
    if (width <= 0 || height <= 0) return;
    
    // Update scaled positions
    const scaleX = calcWidth / width;
    const scaleY = calcHeight / height;
    
    for (let circle of circles) {
        circle.scaledX = circle.x * scaleX;
        circle.scaledY = circle.y * scaleY;
        circle.scaledRadius = circle.radius * Math.min(scaleX, scaleY);
    }
    
    const imageData = ctx.createImageData(calcWidth, calcHeight);
    const data = imageData.data;
    
    time += 0.005;
    const timeOffset = time * 3;
    
    // Process in larger steps for better performance
    for (let x = 0; x < calcWidth; x += 1) {
        for (let y = 0; y < calcHeight; y += 1) {
            let sum = 0;
            let weightedR = 0, weightedG = 0, weightedB = 0;
            let totalWeight = 0;
            
            // Calculate influence from all circles
            for (let i = 0; i < circles.length; i++) {
                const circle = circles[i];
                const dx = x - circle.scaledX;
                const dy = y - circle.scaledY;
                const distSq = dx * dx + dy * dy;
                
                if (distSq > 0) {
                    const radiusSq = circle.scaledRadius * circle.scaledRadius;
                    const influence = radiusSq / distSq;
                    sum += influence;
                    
                    // Weight the color contribution
                    const weight = influence / (Math.sqrt(distSq) * 0.1 + 1);
                    
                    const [r, g, b] = getColor(circle.hueOffset, timeOffset);
                    
                    weightedR += r * weight;
                    weightedG += g * weight;
                    weightedB += b * weight;
                    totalWeight += weight;
                }
            }
            
            const threshold = 1.2;
            if (sum > threshold) {
                const intensity = Math.min(1, (sum - threshold) * 1.5);
                const pixelIndex = (y * calcWidth + x) * 4;
                
                // Calculate blended colors
                const finalR = totalWeight > 0 ? Math.floor((weightedR / totalWeight) * intensity) : 0;
                const finalG = totalWeight > 0 ? Math.floor((weightedG / totalWeight) * intensity) : 0;
                const finalB = totalWeight > 0 ? Math.floor((weightedB / totalWeight) * intensity) : 0;
                
                // Enhanced shimmer effect with theme colors
                const shimmer = 1 + 0.15 * Math.sin(time * 15 + x * 0.05 + y * 0.05);
                const r = Math.min(255, Math.floor(finalR * shimmer));
                const g = Math.min(255, Math.floor(finalG * shimmer));
                const b = Math.min(255, Math.floor(finalB * shimmer));
                
                const alpha = Math.floor(240 * intensity);
                
                data[pixelIndex] = r;
                data[pixelIndex + 1] = g;
                data[pixelIndex + 2] = b;
                data[pixelIndex + 3] = alpha;
            }
        }
    }
    
    // Scale up the low-res calculation to full screen
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = calcWidth;
    tempCanvas.height = calcHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);
    
    // Use smooth scaling to upscale
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tempCanvas, 0, 0, calcWidth, calcHeight, 0, 0, width, height);
}

function addGlowEffect() {
    // Enhanced glow effect with theme colors
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'blur(12px)';
    
    for (let circle of circles) {
        const [r, g, b] = getColor(circle.hueOffset, time * 3);
        
        const gradient = ctx.createRadialGradient(
            circle.x, circle.y, 0,
            circle.x, circle.y, circle.radius * 2
        );
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
}

function draw() {
    if (width <= 0 || height <= 0) {
        requestAnimationFrame(draw);
        return;
    }
    
    // Clear with theme background
    ctx.clearRect(0, 0, width, height);
    
    // Draw metaballs
    drawMetaballs();
    
    // Add glow effect
    addGlowEffect();
    
    // Update circle positions with improved physics
    for (let circle of circles) {
        circle.x += circle.vx;
        circle.y += circle.vy;
        
        const margin = circle.radius * 0.5;
        
        // Smoother boundary physics
        if (circle.x < margin) {
            circle.vx += (margin - circle.x) * 0.02;
        } else if (circle.x > width - margin) {
            circle.vx -= (circle.x - (width - margin)) * 0.02;
        }
        
        if (circle.y < margin) {
            circle.vy += (margin - circle.y) * 0.02;
        } else if (circle.y > height - margin) {
            circle.vy -= (circle.y - (height - margin)) * 0.02;
        }
        
        // Add some randomness
        circle.vx += (Math.random() - 0.5) * 0.1;
        circle.vy += (Math.random() - 0.5) * 0.1;
        
        // Damping
        circle.vx *= 0.995;
        circle.vy *= 0.995;
        
        // Speed limiting
        const maxSpeed = 3;
        const speed = Math.sqrt(circle.vx * circle.vx + circle.vy * circle.vy);
        if (speed > maxSpeed) {
            circle.vx = (circle.vx / speed) * maxSpeed;
            circle.vy = (circle.vy / speed) * maxSpeed;
        }
    }
    
    requestAnimationFrame(draw);
}

// Initialize
buildColorLUT();

if (width > 0 && height > 0) {
    createCircles();
    draw();
} else {
    setTimeout(() => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        calcWidth = Math.floor(width * RESOLUTION_SCALE);
        calcHeight = Math.floor(height * RESOLUTION_SCALE);
        if (width > 0 && height > 0) {
            createCircles();
            draw();
        }
    }, 100);
}