async function loadPoseData() {
    let data = localStorage.getItem('savedPoses');
    if (!data) {
        alert('No pose data found!');
        return null;
    }
    return JSON.parse(data);
}

// function extractFeatures(pose) {
//     // Flatten all keypoints' x and y into a single array
//     return pose.keypoints.flatMap(kp => [kp.position.x, kp.position.y]);
// }

function prepareDataset(savedPoses) {
    const X = [];
    const y = [];
    const labelNames = Object.keys(savedPoses);
    labelNames.forEach((label, idx) => {
        savedPoses[label].forEach(sample => {
            X.push(extractFeatures(sample));
            y.push(idx);
        });
    });
    return {
        xs: tf.tensor2d(X),
        ys: tf.oneHot(tf.tensor1d(y, 'int32'), labelNames.length),
        labelNames
    };
}

function createClassifier(inputSize, numClasses) {
    const model = tf.sequential();
    model.add(tf.layers.dense({units: 64, activation: 'relu', inputShape: [inputSize]}));
    model.add(tf.layers.dense({units: 32, activation: 'relu'}));
    model.add(tf.layers.dense({units: numClasses, activation: 'softmax'}));
    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    return model;
}

async function trainClassifier() {
    const savedPoses = await loadPoseData();
    if (!savedPoses) return;

    const { xs, ys, labelNames } = prepareDataset(savedPoses);
    const model = createClassifier(xs.shape[1], labelNames.length);

    await model.fit(xs, ys, {
        epochs: 30,
        batchSize: 16,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch+1}: loss=${logs.loss.toFixed(4)}, acc=${(logs.acc*100).toFixed(2)}%`);
            }
        }
    });

    // Save the model and label names for later use
    await model.save('localstorage://pose-classifier');
    localStorage.setItem('poseClassifierLabels', JSON.stringify(labelNames));
    alert('Training complete! Model saved.');
}

// function setupTrainUI() {
//     const btn = createButton('Train Pose Classifier');
//     btn.position(10, 10);
//     btn.mousePressed(() => {
//       console.log('Train Pose Classifier button pressed');
//       trainClassifier();
//   });
// }

function setupTrainUI() {
  controlsDiv = select('#controls');
  const btn = createButton('Train Pose Classifier');
  btn.parent(controlsDiv);
  btn.mousePressed(() => trainClassifier());
}

// Call this function from a button or console to train
// trainClassifier();