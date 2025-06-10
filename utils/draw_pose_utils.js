function drawKeypoints(keypoints, minConfidence, colour) {
    keypoints.forEach(keypoint => {
        if (keypoint.score >= minConfidence) {
            const { y, x } = keypoint.position;
            fill(colour)
            noStroke();
            ellipse(x, y, 10, 10);
        }
    });
}

function drawSkeleton(keypoints, minConfidence, colour) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);
    stroke(colour);
    strokeWeight(2);
    adjacentKeyPoints.forEach(([p1, p2]) => {
        line(p1.position.x, p1.position.y, p2.position.x, p2.position.y);
    });
}