/**
 * Detects the chess board position from a video stream.
 * Starts from the center and searches outward for green board colors.
 * 
 * @param stream The MediaStream of the screen capture.
 * @returns Promise resolving to the detected Rect (x, y, width, height).
 */
export async function detectChessBoard(stream: MediaStream): Promise<{ x: number, y: number, width: number, height: number }> {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
            const canvas = document.createElement('canvas');
            const width = video.videoWidth;
            const height = video.videoHeight;

            // Use smaller scale for performance
            const scale = 0.15;
            canvas.width = width * scale;
            canvas.height = height * scale;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                // Fallback to center default
                stream.getTracks().forEach(track => track.stop());
                resolve({
                    x: width / 2 - 300,
                    y: height / 2 - 300,
                    width: 600,
                    height: 600
                });
                return;
            }

            // Wait for the frame to render
            setTimeout(() => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Step 1: Sample center region to find the dominant green color
                const centerX = Math.floor(canvas.width / 2);
                const centerY = Math.floor(canvas.height / 2);
                const sampleRadius = Math.min(canvas.width, canvas.height) / 6; // Sample ~1/3 of center area

                const greenSamples: Array<{ r: number, g: number, b: number }> = [];

                // Sample pixels in center region
                for (let dy = -sampleRadius; dy <= sampleRadius; dy += 3) {
                    for (let dx = -sampleRadius; dx <= sampleRadius; dx += 3) {
                        const x = centerX + dx;
                        const y = centerY + dy;

                        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

                        const i = (y * canvas.width + x) * 4;
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        // Check if this looks like a chess.com green square
                        // Green should be dominant, and within reasonable range
                        if (g > r + 15 && g > b + 15 && g > 80 && g < 220) {
                            greenSamples.push({ r, g, b });
                        }
                    }
                }

                console.log(`Found ${greenSamples.length} green samples in center region`);

                if (greenSamples.length < 10) {
                    // Not enough green found, use default
                    stream.getTracks().forEach(track => track.stop());
                    console.log("Not enough green pixels in center, using default position");
                    resolve({
                        x: width / 2 - 300,
                        y: height / 2 - 300,
                        width: 600,
                        height: 600
                    });
                    return;
                }

                // Calculate average green color
                const avgR = Math.floor(greenSamples.reduce((sum, c) => sum + c.r, 0) / greenSamples.length);
                const avgG = Math.floor(greenSamples.reduce((sum, c) => sum + c.g, 0) / greenSamples.length);
                const avgB = Math.floor(greenSamples.reduce((sum, c) => sum + c.b, 0) / greenSamples.length);

                console.log(`Target green color: RGB(${avgR}, ${avgG}, ${avgB})`);

                // Step 2: Find all pixels matching this green (with tolerance)
                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
                let matchCount = 0;

                const tolerance = 40; // Color tolerance

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        // Check if pixel matches our target green color
                        const rDiff = Math.abs(r - avgR);
                        const gDiff = Math.abs(g - avgG);
                        const bDiff = Math.abs(b - avgB);

                        if (rDiff < tolerance && gDiff < tolerance && bDiff < tolerance) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                            matchCount++;
                        }
                    }
                }

                // Clean up
                stream.getTracks().forEach(track => track.stop());

                console.log(`Found ${matchCount} matching pixels`);

                if (matchCount > 200) { // Reasonable threshold
                    const rect = {
                        x: (minX / scale),
                        y: (minY / scale),
                        width: ((maxX - minX) / scale),
                        height: ((maxY - minY) / scale)
                    };

                    console.log("Detected board:", rect);
                    resolve(rect);
                } else {
                    console.log("Not enough matching pixels, using default");
                    resolve({
                        x: width / 2 - 300,
                        y: height / 2 - 300,
                        width: 600,
                        height: 600
                    });
                }
            }, 800); // Increased delay to ensure video frame is ready
        };

        video.onerror = () => {
            stream.getTracks().forEach(track => track.stop());
            resolve({
                x: 400,
                y: 200,
                width: 600,
                height: 600
            });
        };
    });
}
