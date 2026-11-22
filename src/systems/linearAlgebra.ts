/**
 * Helper for computing a dot product between two vectors. Throws an error if
 * vectors have different dimensions or are empty.
 * @param a - The first vector in the dot product.
 * @param b - The second vector in the dot product.
 * @returns - The dot product of a and b.
 */
export function dot(a: number[], b: number[]): number{
    if(a.length != b.length) throw new Error("Inputs must have same length.");
    if(a.length == 0 || b.length == 0) throw new Error("Inputs must not be empty.");
    let multArr = a.map((v, i) => v * b[i]);
    return multArr.reduce((acc, curr) => acc + curr);
}

/**
 * Helper for finding the norm of a vector. Throws an error if input vector 
 * is empty.
 * @param a - The vector whose norm is requested.
 * @returns - The vector's norm ||a||.
 */
export function vecNorm(a: number[]): number{
    if(a.length == 0) throw new Error("Input must not be empty.");
    return Math.sqrt(a.reduce((acc, curr) => acc + Math.pow(curr, 2), 0));
}

/**
 * Helper for normalizing a vector. Throws an error if input vector is empty.
 * @param a - The vector to be normalized.
 * @returns - The normalized vector.
 */
export function normalize(a: number[]): number[]{
    if(a.length == 0) throw new Error("Input must not be empty.");
    let norm = vecNorm(a);
    return a.map((v) => v / norm);
}

/**
 * Helper for computing element-wise summation between two vectors (a + b). 
 * Throws an error if vectors have different dimensions or are empty.
 * @param a - The first vector to add.
 * @param b - The second vector to add.
 * @returns - The sum a + b.
 */
export function vecSum(a: number[], b: number[]): number[]{
    if(a.length != b.length) throw new Error("Inputs must have same length.");
    if(a.length == 0 || b.length == 0) throw new Error("Inputs must not be empty.");
    return a.map((v, i) => v + b[i]);
}

/**
 * Helper for computing element-wise difference between two vectors (a - b). 
 * Throws an error if vectors have different dimensions or are empty.
 * @param a - The vector to be subtracted from.
 * @param b - The vector to subtract.
 * @returns - The difference a - b.
 */
export function vecDiff(a: number[], b: number[]): number[]{
    if(a.length != b.length) throw new Error("Inputs must have same length.");
    if(a.length == 0 || b.length == 0) throw new Error("Inputs must not be empty.");
    return a.map((v, i) => v - b[i]);
}

/**
 * Helper for scaling a vector by a constant. Throws an error if input vector 
 * is empty.
 * @param a - The vector to be scaled.
 * @param c - The scaling constant.
 * @returns - The scaled vector ca.
 */
export function vecScale(a: number[], c: number): number[]{
    if(a.length == 0) throw new Error("Input must not be empty.");
    return a.map((v) => c * v);
}

