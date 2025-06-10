function extractFeatures(pose) {
    // Filter keypoints by confidence
    const minConfidence = 0.2;
    const validKeypoints = pose.keypoints.filter(kp => kp.score > minConfidence);

    // If not enough keypoints, return zeros
    if (validKeypoints.length < 3) {
        return Array(pose.keypoints.length * 2).fill(0);
    }

    // Find bounding box
    const xs = validKeypoints.map(kp => kp.position.x);
    const ys = validKeypoints.map(kp => kp.position.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const scale = Math.max(maxX - minX, maxY - minY) || 1;

    // Normalize all keypoints (even low-confidence ones, for consistent length)
    return pose.keypoints.flatMap(kp => [
        (kp.position.x - centerX) / scale,
        (kp.position.y - centerY) / scale
    ]);
}