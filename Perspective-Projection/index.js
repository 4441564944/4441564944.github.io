const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const distanceSlider = document.getElementById('objectDistance');
const sizeSlider = document.getElementById('objectSize');
const distanceValue = document.getElementById('distanceValue');
const sizeValue = document.getElementById('sizeValue');
const formulaText = document.getElementById('formula');

// Camera constants (in canvas coordinates)
const PINHOLE_X = 400;
const PINHOLE_Y = 200;
const FOCAL_LENGTH = 200; // distance from pinhole to image plane
const IMAGE_PLANE_X = PINHOLE_X + FOCAL_LENGTH;

function draw() {
    const objectDistance = parseInt(distanceSlider.value);
    const objectSize = parseInt(sizeSlider.value);

    // Update display values
    distanceValue.textContent = objectDistance;
    sizeValue.textContent = objectSize;

    // Calculate image size using similar triangles
    const imageSize = objectSize * (FOCAL_LENGTH / objectDistance);

    // Update formula
    formulaText.textContent = `${imageSize.toFixed(1)} = ${objectSize} × (${FOCAL_LENGTH} / ${objectDistance})`;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw camera box
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(PINHOLE_X, 80, FOCAL_LENGTH, 240);

    // Draw axis of symmetry
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, PINHOLE_Y);
    ctx.lineTo(750, PINHOLE_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw image plane
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(IMAGE_PLANE_X, 80);
    ctx.lineTo(IMAGE_PLANE_X, 320);
    ctx.stroke();

    // Draw pinhole
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(PINHOLE_X, PINHOLE_Y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Calculate object position
    const objectX = PINHOLE_X - objectDistance;
    const objectTop = PINHOLE_Y - objectSize / 2;
    const objectBottom = PINHOLE_Y + objectSize / 2;

    // Draw object
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(objectX, objectTop);
    ctx.lineTo(objectX, objectBottom);
    ctx.stroke();

    // Draw object endpoints
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.arc(objectX, objectTop, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(objectX, objectBottom, 3, 0, Math.PI * 2);
    ctx.fill();

    // Calculate image position
    const imageTop = PINHOLE_Y - imageSize / 2;
    const imageBottom = PINHOLE_Y + imageSize / 2;

    // Draw image
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(IMAGE_PLANE_X - 5, imageTop);
    ctx.lineTo(IMAGE_PLANE_X - 5, imageBottom);
    ctx.stroke();

    // Draw image endpoints
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.arc(IMAGE_PLANE_X - 5, imageTop, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(IMAGE_PLANE_X - 5, imageBottom, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw light rays
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;

    // Ray from top of object through pinhole to bottom of image
    ctx.beginPath();
    ctx.moveTo(objectX, objectTop);
    ctx.lineTo(PINHOLE_X, PINHOLE_Y);
    ctx.lineTo(IMAGE_PLANE_X - 5, imageBottom);
    ctx.stroke();

    // Ray from bottom of object through pinhole to top of image
    ctx.beginPath();
    ctx.moveTo(objectX, objectBottom);
    ctx.lineTo(PINHOLE_X, PINHOLE_Y);
    ctx.lineTo(IMAGE_PLANE_X - 5, imageTop);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#2d2d2d';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('object', objectX, objectBottom + 20);

    ctx.fillStyle = '#4a4a4a';
    ctx.fillText('image', IMAGE_PLANE_X - 5, imageBottom + 20);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillText('pinhole', PINHOLE_X, 70);

    ctx.fillStyle = '#666';
    ctx.textAlign = 'left';
    ctx.fillText('image plane', IMAGE_PLANE_X + 10, PINHOLE_Y);
}

// Event listeners
distanceSlider.addEventListener('input', draw);
sizeSlider.addEventListener('input', draw);

// Initial draw
draw();
