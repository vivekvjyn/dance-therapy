// train_model.js

const startTrainingBtn = document.getElementById('start-training-btn');
const trainingStatus = document.getElementById('training-status');

let collectedData = JSON.parse(localStorage.getItem('dancePoseData')) || {};
let trainedModel;

async function trainModel() {
    trainingStatus.textContent = "Preparing data for training...";
    startTrainingBtn.disabled = true;

    const classNames = Object.keys(collectedData);
    if (classNames.length < 2) {
        trainingStatus.textContent = "Need data for at least 2 dance moves to train a model.";
        startTrainingBtn.disabled = false;
        return;
    }

    const trainingData = [];
    const trainingLabels = [];

    // Flatten keypoints for input to the neural network
    // Each pose will be a 1D array of [x1, y1, score1, x2, y2, score2, ...]
    classNames.forEach((className, classIndex) => {
        const poses = collectedData[className];
        poses.forEach(pose => {
            const flattenedPose = pose.flatMap(kp => [kp.x, kp.y, kp.score]);
            trainingData.push(flattenedPose);
            trainingLabels.push(classIndex);
        });
    });

    if (trainingData.length === 0) {
        trainingStatus.textContent = "No valid data found for training. Please collect some.";
        startTrainingBtn.disabled = false;
        return;
    }

    // Convert to TensorFlow.js Tensors
    const xs = tf.tensor2d(trainingData);
    const ys = tf.oneHot(tf.tensor1d(trainingLabels, 'int32'), classNames.length);

    // Define the model
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [trainingData[0].length], units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: classNames.length, activation: 'softmax' }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    trainingStatus.textContent = "Training model...";
    await model.fit(xs, ys, {
        epochs: 50, // You can adjust the number of epochs
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                trainingStatus.textContent = `Epoch ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}, Accuracy = ${logs.acc.toFixed(4)}`;
            }
        }
    });

    trainedModel = model;
    await trainedModel.save('localstorage://dance-pose-model');
    localStorage.setItem('danceClassNames', JSON.stringify(classNames)); // Save class names for prediction
    trainingStatus.textContent = "Model trained and saved successfully!";
    startTrainingBtn.disabled = false;
    console.log("Model trained and saved.");
}

// Event Listener for train_model section
document.getElementById('train-model-btn').addEventListener('click', () => {
    collectedData = JSON.parse(localStorage.getItem('dancePoseData')) || {};
    trainingStatus.textContent = "Ready to train. Make sure you have collected data for your moves.";
    startTrainingBtn.disabled = false;
});

startTrainingBtn.addEventListener('click', trainModel);