// game.js

const gameWebcam = document.getElementById('game-webcam');
const gameOutputCanvas = document.getElementById('game-output-canvas');
const gameOutputCtx = gameOutputCanvas.getContext('2d');
const targetPoseCanvas = document.getElementById('target-pose-canvas');
const targetPoseCtx = targetPoseCanvas.getContext('2d');
const gameFeedback = document.getElementById('game-feedback');
const startGameBtn = document.getElementById('start-game-btn');

let gamePosenetModel;
let gameTrainedModel;
let gameClassNames = [];
let gamePoseData = {}; // Raw collected pose data for displaying targets
let currentTargetMove = '';
let gameInterval;
let gameIsRunning = false;

async function loadGameResources() {
    console.log("Loading game resources...");
    gamePosenetModel = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75
    });
    console.log("Game PoseNet model loaded.");

    try {
        gameTrainedModel = await tf.loadLayersModel('localstorage://dance-pose-model');
        gameClassNames = JSON.parse(localStorage.getItem('danceClassNames'));
        gamePoseData = JSON.parse(localStorage.getItem('dancePoseData'));

        if (!gameTrainedModel || !gameClassNames || gameClassNames.length === 0 || !gamePoseData || Object.keys(gamePoseData).length === 0) {
            gameFeedback.textContent = "Model not found or data missing. Please collect data and train the model first.";
            startGameBtn.disabled = true;
            return;
        }
        console.log("Trained model and class names loaded.");
        startGameBtn.disabled = false;
    } catch (error) {
        console.error("Error loading trained model or class names:", error);
        gameFeedback.textContent = "Error loading model. Please train the model first.";
        startGameBtn.disabled = true;
    }
}

async function setupGameWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 'video': true });
        gameWebcam.srcObject = stream;
        gameWebcam.onloadedmetadata = () => {
            gameWebcam.play();
            if (!gameIsRunning) { // Only start pose estimation if game is not running yet
                 estimateGamePoses();
            }
        };
    } catch (err) {
        console.error("Error accessing game webcam: ", err);
        gameFeedback.textContent = "Could not access webcam for game.";
        startGameBtn.disabled = true;
    }
}

function drawAveragePose(moveName, canvasCtx) {
    canvasCtx.clearRect(0, 0, targetPoseCanvas.width, targetPoseCanvas.height);
    canvasCtx.fillStyle = '#f8f9fa';
    canvasCtx.fillRect(0, 0, targetPoseCanvas.width, targetPoseCanvas.height); // Background for the rounded square

    const posesForMove = gamePoseData[moveName];
    if (!posesForMove || posesForMove.length === 0) {
        console.warn(`No pose data for move: ${moveName}`);
        return;
    }

    // Calculate average keypoints
    const averageKeypoints = {};
    const numKeypoints = posesForMove[0].length; // Assuming all poses have same number of keypoints

    // Initialize sums for each keypoint part
    posesForMove[0].forEach(kp => {
        averageKeypoints[kp.part] = { xSum: 0, ySum: 0, scoreSum: 0, count: 0 };
    });

    // Sum up positions and scores
    posesForMove.forEach(pose => {
        pose.forEach(kp => {
            if (averageKeypoints[kp.part]) {
                averageKeypoints[kp.part].xSum += kp.x;
                averageKeypoints[kp.part].ySum += kp.y;
                averageKeypoints[kp.part].scoreSum += kp.score;
                averageKeypoints[kp.part].count++;
            }
        });
    });

    const finalKeypoints = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Calculate averages and find bounding box
    for (const part in averageKeypoints) {
        const avg = averageKeypoints[part];
        if (avg.count > 0) {
            const avgX = avg.xSum / avg.count;
            const avgY = avg.ySum / avg.count;
            const avgScore = avg.scoreSum / avg.count;
            finalKeypoints.push({ part: part, position: { x: avgX, y: avgY }, score: avgScore });

            minX = Math.min(minX, avgX);
            minY = Math.min(minY, avgY);
            maxX = Math.max(maxX, avgX);
            maxY = Math.max(maxY, avgY);
        }
    }

    // Normalize and scale keypoints to fit within the target canvas
    const padding = 20;
    const poseWidth = maxX - minX;
    const poseHeight = maxY - minY;
    const scaleX = (targetPoseCanvas.width - 2 * padding) / poseWidth;
    const scaleY = (targetPoseCanvas.height - 2 * padding) / poseHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledKeypoints = finalKeypoints.map(kp => ({
        ...kp,
        position: {
            x: (kp.position.x - minX) * scale + padding,
            y: (kp.position.y - minY) * scale + padding
        }
    }));

    // Draw the scaled average pose
    drawKeypoints(scaledKeypoints, 0.6, 'blue', canvasCtx);
    drawSkeleton(scaledKeypoints, 0.7, 'blue', canvasCtx);
}

async function estimateGamePoses() {
    if (!gameIsRunning) {
        gameOutputCtx.clearRect(0, 0, gameOutputCanvas.width, gameOutputCanvas.height);
        gameOutputCtx.save();
        gameOutputCtx.scale(-1, 1);
        gameOutputCtx.translate(-gameOutputCanvas.width, 0);
        gameOutputCtx.drawImage(gameWebcam, 0, 0, gameWebcam.width, gameWebcam.height);
        gameOutputCtx.restore();
    }


    if (gamePosenetModel && gameWebcam.readyState === 4 && gameTrainedModel) {
        const poses = await gamePosenetModel.estimateSinglePose(gameWebcam, {
            flipHorizontal: false,
            decodingMethod: 'single-person'
        });

        if (poses && poses.score > 0.2) {
            drawKeypoints(poses.keypoints, 0.6, 'red', gameOutputCtx);
            drawSkeleton(poses.keypoints, 0.7, 'white', gameOutputCtx);

            if (gameIsRunning && currentTargetMove) {
                // Flatten user's current pose for prediction
                const userPoseFlattened = poses.keypoints.flatMap(kp => [kp.position.x, kp.position.y, kp.score]);
                const inputTensor = tf.tensor2d([userPoseFlattened]);

                const prediction = gameTrainedModel.predict(inputTensor);
                const scores = prediction.dataSync();
                const predictedClassIndex = scores.indexOf(Math.max(...scores));
                const predictedClassName = gameClassNames[predictedClassIndex];

                if (predictedClassName === currentTargetMove) {
                    gameFeedback.textContent = `GREAT! You matched: ${predictedClassName}`;
                    gameFeedback.style.color = 'green';
                } else {
                    gameFeedback.textContent = `Try again! Target: ${currentTargetMove}, You: ${predictedClassName}`;
                    gameFeedback.style.color = 'red';
                }
            }
        }
    }
    if (gameIsRunning || document.getElementById('game-section').classList.contains('hidden') === false) { // Continue estimating poses if game is running or section is visible
        requestAnimationFrame(estimateGamePoses);
    }
}

function getRandomDanceMove() {
    if (gameClassNames.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * gameClassNames.length);
    return gameClassNames[randomIndex];
}

function startGame() {
    if (!gameTrainedModel) {
        gameFeedback.textContent = "Please train a model first!";
        return;
    }
    gameIsRunning = true;
    startGameBtn.disabled = true;

    // Start showing random moves
    gameInterval = setInterval(() => {
        currentTargetMove = getRandomDanceMove();
        if (currentTargetMove) {
            gameFeedback.textContent = `Match the pose: ${currentTargetMove}`;
            gameFeedback.style.color = 'black';
            drawAveragePose(currentTargetMove, targetPoseCtx);
        } else {
            gameFeedback.textContent = "No dance moves available. Collect and train data!";
            clearInterval(gameInterval);
            startGameBtn.disabled = false;
            gameIsRunning = false;
        }
    }, 5000); // Change pose every 5 seconds
}

function stopGame() {
    clearInterval(gameInterval);
    gameIsRunning = false;
    startGameBtn.disabled = false;
    gameFeedback.textContent = "Game Stopped.";
    targetPoseCtx.clearRect(0, 0, targetPoseCanvas.width, targetPoseCanvas.height);
}

// Event Listeners for game section
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('play-game-btn').addEventListener('click', () => {
        setupGameWebcam();
        loadGameResources(); // Load model and class names when entering game section
    });
    startGameBtn.addEventListener('click', startGame);
    document.getElementById('back-to-menu-from-game').addEventListener('click', stopGame); // Stop game when going back to menu
});