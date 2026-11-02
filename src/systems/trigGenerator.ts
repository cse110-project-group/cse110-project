import { generateExactValues } from 'randmatqugea/src/modules/Trigonometry/GenerateExactValues';
import { generateSin, generateCosine, generateTangent } from 'randmatqugea/src/modules/Trigonometry/TrigBasic';
import { generateGeneralSolutions } from 'randmatqugea/src/modules/Trigonometry/GenerateGeneralSolutions';

/**
 * Generic interface that represents a trig question for our game to use. 
 * Stores the difficulty of the question, the prompt text, and
 * the answer to the question as strings.
 * @example
 * const q: Question = { difficulty: 'easy', prompt: 'cos(120°)', answer: '−1/2' };
 */
export interface Question {
    difficulty: string;
    prompt: string;
    answer: string;
}

/**
 * Question interface for Lock Question format.
 * Extends Question interface to include list of lock numbers, which
 * holds 4 clock positions from 1 to 12, with 12 at the top and 6 at 
 * the bottom.
 * @example
 * const lockQ: LockQuestion = {
 *   difficulty: 'easy',
 *   prompt: 'tan(x) = 1',
 *   answer: 'x = \\frac{\\pi}{4} + n\\pi',
 *   lockNumbers: [2, 8, 2, 8]
 * }
 */
export interface LockQuestion extends Question {
    lockNumbers: number[];
}

/** 
 * Generic interface that represents a question source for our game.
 * Has a getQuestion method. 
*/
export interface QuestionSource {
    /**
     * Returns trig question from RandMatQuGeA.
     * 
     * @param difficulty - Difficulty level of generated question.
     */
    getQuestion(difficulty?: string): Question;
}

/**
 * Turns difficulty passed into function into proper format
 * for getQuestion, to account for case sensitivity.
 * @param difficulty - Difficulty level passed in by caller.
 * @returns lower case version of difficulty.
 * @throws {Error} If `difficulty` is not 'easy', 'medium', or 'hard'.
 */
function normalizeDifficulty(difficulty?: string) {
    const level = (difficulty ?? 'easy').toLowerCase();
    if (!['easy', 'medium', 'hard'].includes(level)) throw new Error(`Unknown difficulty: ${difficulty}`);
    return level;
}


/**
 * Parses question prompt and extracts mathematical equation.
 * @param prompt - string containing question prompt
 * @returns latex mathematical equation if equation found, otherwise question prompt
 */
function extractMathFromPrompt(prompt: string): string {
    const match = prompt.match(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/);
    
    if (match) {
        return (match[1] || match[2]).trim();
    }
    
    return prompt; 
}

/**
 * A question source that generates trigonometric lock-combination puzzle questions.
 * Fetches general trigonometric solutions based on difficulty and maps them 
 * to a 4-digit 1-12 clock position combination for a lock mechanism.
 * 
 * @implements {QuestionSource}
 * @example
 * const source = new LockGameQuestionSource();
 * const question = source.getQuestion('medium');
 * console.log(question.lockNumbers); // e.g., [12, 6, 12, 6]
 */
export class LockGameQuestionSource implements QuestionSource {
    /**
     * Generates a lock game question for a given difficulty level.
     * 
     * @param {string} [difficulty] - The difficulty level (e.g., 'easy', 'medium', 'hard').
     * @returns A LockQuestion where:
     *  - `prompt` is the equation to solve, as LaTeX
     *  - `answer` is its general solution, as LaTeX
     *  - `lockNumbers` is the 4-position combination, as clock positions 1 to 12
     *    (e.g. `[2, 8, 2, 8]`)
     */
    getQuestion(difficulty?: string): LockQuestion {
        const level = normalizeDifficulty(difficulty);

        let raw = generateGeneralSolutions(level);

        while (raw.subskill !== "all_solutions") {
            raw = generateGeneralSolutions(level);
        }

        const lockCombination = this.get12PositionLockCombination(raw.correct);

        return {
            difficulty: level,
            prompt: extractMathFromPrompt(raw.latex),
            answer: raw.correct,
            lockNumbers: lockCombination
        }
    } 
    /**
     * Converts trigonometric angle solutions into a 4-digit 1-12 clock position array
     * for the puzzle lock mechanism.
     * 
     * @private
     * @param {string} answerStr - The string representation of the trigonometric general solution.
     * @returns {number[]} An array of 4 integers representing clock positions ranging from 1 to 12.
     */
    private get12PositionLockCombination(answerStr: string): number[] {
        const toLockPosition = (degrees: number): number => {
            let normDeg = ((degrees % 360) + 360) % 360;
            const pos = Math.round(normDeg / 30) % 12;
            return pos === 0 ? 12 : pos; 
        };

        switch (answerStr) {
            case "x = n\\pi":
                return [toLockPosition(0), toLockPosition(180), toLockPosition(0), toLockPosition(180)]; // [12, 6, 12, 6]

            case "x = \\frac{\\pi}{2} + n\\pi":
                return [toLockPosition(90), toLockPosition(270), toLockPosition(90), toLockPosition(270)]; // [3, 9, 3, 9]

            case "x = \\frac{\\pi}{4} + n\\pi":
                return [toLockPosition(45), toLockPosition(225), toLockPosition(45), toLockPosition(225)]; // [2, 8, 2, 8]

            case "x = \\frac{\\pi}{3} + n\\pi":
                return [toLockPosition(60), toLockPosition(240), toLockPosition(60), toLockPosition(240)]; // [2, 8, 2, 8]

            case "x = n\\pi + (-1)^{n}\\frac{\\pi}{6}":
                return [toLockPosition(30), toLockPosition(150), toLockPosition(30), toLockPosition(150)]; // [1, 5, 1, 5]

            case "x = n\\pi + (-1)^{n}\\frac{\\pi}{3}":
                return [toLockPosition(60), toLockPosition(120), toLockPosition(60), toLockPosition(120)]; // [2, 4, 2, 4]

            case "x = \\frac{2\\pi}{3} + 2n\\pi \\text{ or } x = \\frac{4\\pi}{3} + 2n\\pi":
                return [toLockPosition(120), toLockPosition(240), toLockPosition(120), toLockPosition(240)]; // [4, 8, 4, 8]

            default:
                return [3, 6, 9, 12];
        }
    }
}

/**
 * Question source that generates exact-value matching questions.
 * Parses mathematical expressions and their evaluated values to create expression-to-value pairs
 * for card matching game.
 * 
 * @implements {QuestionSource}
 * @example
 * const source = new MatchingGameQuestionSource();
 * const question = source.getQuestion('easy');
 * console.log(question.prompt); // e.g., "\tan\left(120^{\circ}\right) "
 * console.log(question.answer); // e.g., " -\sqrt{3}"
 */
export class MatchingGameQuestionSource implements QuestionSource {
    /**
     * Generates a matching game question for a given difficulty level.
     * Each question is one card pair: an expression and its exact value.
     * Different questions can have the same answer (e.g. sin(30°) and cos(60°)),
     * so callers building a round should skip any answer they already have.

     * @param {string} [difficulty] - The difficulty level (e.g., 'easy', 'medium', 'hard'), defaults to 'easy'.
     * @returns {Question} A Question where:
     * - `prompt` is the trig expression, as LaTeX 
     * - `answer` is its exact value, as LaTeX
     * @throws {Error} If `difficulty` is not 'easy', 'medium', or 'hard'.
     * @throws {Error} If the library's output cannot be split into an expression and a value.
     */
    getQuestion(difficulty?: string): Question {
        const level = normalizeDifficulty(difficulty);
        const raw = generateExactValues(level);

        const [expression, value] = (raw.display ?? '').split("=");
        if (!expression || !value) throw new Error(`Unexpected exact-value format: ${raw.display}`);

        return {
            difficulty: level,
            prompt: expression,
            answer: value,
        }
    }
}


