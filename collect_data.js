// collect_data.js

const webcam = document.getElementById('webcam');
const outputCanvas = document.getElementById('output-canvas');
const outputCtx = outputCanvas.getContext('2d');
const countdownDisplay = document.getElementById('countdown');
const startRecordingBtn = document.getElementById('start-recording-btn');
const stopRecordingBtn = document.getElementById('stop-recording-btn');
const addMoveBtn = document.getElementById('add-move-btn');
const selectedMovesDisplay = document.getElementById('selected-moves-display');

let posenetModel;
let recording = false;
let currentPoseData = [];
let selectedMoveNames = [];
let currentMoveName = '';
let countdownInterval;
const RECORD_DURATION_SECONDS = 3; // Duration for each move recording

// Store collected data in an object where keys are move names
// and values are arrays of pose data (each pose data is an array of keypoints)
let allCollectedPoseData = JSON.parse(localStorage.getItem('dancePoseData')) || {};

async function loadPosenet() {
    console.log("Loading PoseNet model...");
    posenetModel = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75
    });
    console.log("PoseNet model loaded.");
    startRecordingBtn.disabled = false; // Enable button once model is loaded
}

async function setupWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 'video': true });
        webcam.srcObject = stream;
        webcam.onloadedmetadata = () => {
            webcam.play();
            estimatePoses();
        };
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        alert("Could not access webcam. Please ensure you have a camera and grant permissions.");
    }
}

function drawKeypoints(keypoints, minConfidence, skeletonColor, canvasCtx) {
    keypoints.forEach(keypoint => {
        if (keypoint.score >= minConfidence) {
            const { y, x } = keypoint.position;
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
            canvasCtx.fillStyle = skeletonColor;
            canvasCtx.fill();
        }
    });
}

function drawSkeleton(keypoints, minConfidence, skeletonColor, canvasCtx) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);
    adjacentKeyPoints.forEach(([p1, p2]) => {
        canvasCtx.beginPath();
        canvasCtx.moveTo(p1.position.x, p1.position.y);
        canvasCtx.lineTo(p2.position.x, p2.position.y);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = skeletonColor;
        canvasCtx.stroke();
    });
}

async function estimatePoses() {
    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    outputCtx.save();
    outputCtx.scale(-1, 1);
    outputCtx.translate(-outputCanvas.width, 0);
    outputCtx.drawImage(webcam, 0, 0, webcam.width, webcam.height);
    outputCtx.restore();

    if (posenetModel && webcam.readyState === 4) { // webcam.readyState === 4 means video is ready
        const poses = await posenetModel.estimateSinglePose(webcam, {
            flipHorizontal: false, // We're already flipping the canvas for drawing
            decodingMethod: 'single-person'
        });

        if (poses && poses.score > 0.2) { // Only draw if confidence is reasonable
            drawKeypoints(poses.keypoints, 0.6, 'red', outputCtx);
            drawSkeleton(poses.keypoints, 0.7, 'white', outputCtx);

            if (recording) {
                // Normalize keypoints (e.g., relative to a central point or bounding box)
                // For simplicity, we'll just store the raw keypoints for now,
                // but normalization is crucial for robust ML.
                currentPoseData.push(poses.keypoints.map(kp => ({
                    part: kp.part,
                    x: kp.position.x,
                    y: kp.position.y,
                    score: kp.score
                })));
            }
        }
    }
    requestAnimationFrame(estimatePoses);
}

function startRecordingCountdown() {
    let timeLeft = RECORD_DURATION_SECONDS;
    countdownDisplay.textContent = timeLeft;
    countdownDisplay.classList.remove('hidden'); // Ensure countdown is visible

    countdownInterval = setInterval(() => {
        timeLeft--;
        countdownDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            stopRecording();
            countdownDisplay.classList.add('hidden'); // Hide countdown after recording
        }
    }, 1000);
}

function startRecording() {
    if (!currentMoveName) {
        alert("Please add and select a dance move first.");
        return;
    }
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = false;
    currentPoseData = []; // Clear previous data for this move
    recording = true;
    console.log(`Recording started for move: ${currentMoveName}`);
    startRecordingCountdown();
}

function stopRecording() {
    recording = false;
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
    clearInterval(countdownInterval);
    console.log(`Recording stopped for move: ${currentMoveName}. Collected ${currentPoseData.length} frames.`);

    if (currentPoseData.length > 0) {
        if (!allCollectedPoseData[currentMoveName]) {
            allCollectedPoseData[currentMoveName] = [];
        }
        allCollectedPoseData[currentMoveName].push(...currentPoseData); // Add to the existing array for this move
        localStorage.setItem('dancePoseData', JSON.stringify(allCollectedPoseData));
        console.log(`Data for "${currentMoveName}" saved. Total samples for this move: ${allCollectedPoseData[currentMoveName].length}`);
        alert(`Recorded ${currentPoseData.length} frames for "${currentMoveName}".`);
    } else {
        alert("No data collected. Make sure your pose is visible.");
    }
}

function addMove() {
    if (selectedMoveNames.length >= 3) {
        alert("You can only select up to 3 dance moves.");
        return;
    }
    const moveName = prompt("Enter a name for your dance move:");
    if (moveName && moveName.trim() !== '' && !selectedMoveNames.includes(moveName.trim())) {
        selectedMoveNames.push(moveName.trim());
        currentMoveName = moveName.trim(); // Set the newly added move as the current one
        updateSelectedMovesDisplay();
        startRecordingBtn.disabled = false; // Enable recording once a move is added
    } else if (moveName) {
        alert("Move name is invalid or already exists.");
    }
}

function updateSelectedMovesDisplay() {
    selectedMovesDisplay.innerHTML = '';
    selectedMoveNames.forEach(name => {
        const span = document.createElement('span');
        span.classList.add('move-tag');
        span.textContent = name;
        if (name === currentMoveName) {
            span.style.backgroundColor = '#28a745'; // Highlight current move
            span.style.color = 'white';
        }
        span.addEventListener('click', () => {
            currentMoveName = name;
            updateSelectedMovesDisplay();
            startRecordingBtn.disabled = false;
        });
        selectedMovesDisplay.appendChild(span);
    });
}

// Event Listeners for collect_data section
document.addEventListener('DOMContentLoaded', () => {
    // Only load posenet and setup webcam when the collect data section is active
    document.getElementById('collect-data-btn').addEventListener('click', () => {
        setupWebcam();
        loadPosenet();
        updateSelectedMovesDisplay(); // Load existing moves if any
    });
    startRecordingBtn.addEventListener('click', startRecording);
    stopRecordingBtn.addEventListener('click', stopRecording);
    addMoveBtn.addEventListener('click', addMove);
});