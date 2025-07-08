const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
let time = 0;

const RESOLUTION_SCALE = 0.05;
let calcWidth = Math.floor(width * RESOLUTION_SCALE);
let calcHeight = Math.floor(height * RESOLUTION_SCALE);

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    calcWidth = Math.floor(width * RESOLUTION_SCALE);
    calcHeight = Math.floor(height * RESOLUTION_SCALE);
    if (width > 0 && height > 0) {
        updateCircleScale();
        updateClipping();
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
    [208, 242, 5],
    [93, 245, 201],
    [255, 59, 129],
    [238, 130, 238], 
    [0, 255, 255],
];

// Pre-calculate color lookup table
const COLOR_LUT_SIZE = 256;
let colorLUT = [];

function buildColorLUT() {
    colorLUT = [];
    for (let i = 0; i < COLOR_LUT_SIZE; i++) {
        const phase = i / COLOR_LUT_SIZE;
        const numColors = THEME_COLORS.length;
        
        const colorIndex = phase * numColors;
        const baseIndex = Math.floor(colorIndex) % numColors;
        const nextIndex = (baseIndex + 1) % numColors;
        const blend = colorIndex - Math.floor(colorIndex);
        
        const baseColor = THEME_COLORS[baseIndex];
        const nextColor = THEME_COLORS[nextIndex];
        
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
    
    for (let x = 0; x < calcWidth; x += 1) {
        for (let y = 0; y < calcHeight; y += 1) {
            let sum = 0;
            let weightedR = 0, weightedG = 0, weightedB = 0;
            let totalWeight = 0;
            
            for (let i = 0; i < circles.length; i++) {
                const circle = circles[i];
                const dx = x - circle.scaledX;
                const dy = y - circle.scaledY;
                const distSq = dx * dx + dy * dy;
                
                if (distSq > 0) {
                    const radiusSq = circle.scaledRadius * circle.scaledRadius;
                    const influence = radiusSq / distSq;
                    sum += influence;
                    
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
                
                const finalR = totalWeight > 0 ? Math.floor((weightedR / totalWeight) * intensity) : 0;
                const finalG = totalWeight > 0 ? Math.floor((weightedG / totalWeight) * intensity) : 0;
                const finalB = totalWeight > 0 ? Math.floor((weightedB / totalWeight) * intensity) : 0;
                
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
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = calcWidth;
    tempCanvas.height = calcHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tempCanvas, 0, 0, calcWidth, calcHeight, 0, 0, width, height);
}

function addGlowEffect() {
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

function updateClipping() {
    const clipElements = document.querySelectorAll('[id="background-clip"]');
    const clippedElements = document.querySelectorAll('*:not([id="background-clip"]):not(html):not(head):not(body):not(script):not(style)');
    
    if (clipElements.length === 0) {
        clippedElements.forEach(el => {
            el.style.clipPath = 'none';
        });
        return;
    }
    
    clippedElements.forEach(el => {
        if (el === document.documentElement || el === document.body || el === canvas) {
            return;
        }
        
        const elRect = el.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        const elLeft = elRect.left + scrollX;
        const elTop = elRect.top + scrollY;
        
        let hasIntersection = false;
        
        clipElements.forEach(clipEl => {
            const clipRect = clipEl.getBoundingClientRect();
            
            const clipLeft = clipRect.left + scrollX;
            const clipTop = clipRect.top + scrollY;
            const clipRight = clipLeft + clipRect.width;
            const clipBottom = clipTop + clipRect.height;
            
            // Check if there's an intersection
            if (clipRight > elLeft && clipLeft < elLeft + elRect.width &&
                clipBottom > elTop && clipTop < elTop + elRect.height) {
                
                // Calculate intersection relative to element
                const relativeLeft = Math.max(0, clipLeft - elLeft);
                const relativeTop = Math.max(0, clipTop - elTop);
                const relativeRight = Math.min(elRect.width, clipRight - elLeft);
                const relativeBottom = Math.min(elRect.height, clipBottom - elTop);
                
                // Convert to percentages
                const leftPercent = (relativeLeft / elRect.width) * 100;
                const topPercent = (relativeTop / elRect.height) * 100;
                const rightPercent = (relativeRight / elRect.width) * 100;
                const bottomPercent = (relativeBottom / elRect.height) * 100;
                
                el.style.clipPath = `polygon(${leftPercent}% ${topPercent}%, ${rightPercent}% ${topPercent}%, ${rightPercent}% ${bottomPercent}%, ${leftPercent}% ${bottomPercent}%)`;
                hasIntersection = true;
            }
        });
        
        if (!hasIntersection) {
            el.style.clipPath = 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)';
        }
    });
}

function draw() {
    if (width <= 0 || height <= 0) {
        requestAnimationFrame(draw);
        return;
    }
    
    ctx.clearRect(0, 0, width, height);

    drawMetaballs();
    addGlowEffect();
    
    for (let circle of circles) {
        circle.x += circle.vx;
        circle.y += circle.vy;
        
        const margin = circle.radius * 0.5;
        
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
updateClipping();
window.addEventListener('resize', updateClipping);
window.addEventListener('scroll', updateClipping);

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