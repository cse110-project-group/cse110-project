import { describe, expect, it, vi } from 'vitest';
import { generateExactValues } from 'randmatqugea/src/modules/Trigonometry/GenerateExactValues';
import { generateGeneralSolutions } from 'randmatqugea/src/modules/Trigonometry/GenerateGeneralSolutions';
import { LockGameQuestionSource, MatchingGameQuestionSource } from '../../src/systems/trigGenerator.ts';


vi.mock('randmatqugea/src/modules/Trigonometry/GenerateExactValues', async (importOriginal) => {
	const actual = await importOriginal<typeof import('randmatqugea/src/modules/Trigonometry/GenerateExactValues')>();
	return { ...actual, generateExactValues: vi.fn(actual.generateExactValues) };
});
vi.mock('randmatqugea/src/modules/Trigonometry/GenerateGeneralSolutions', async (importOriginal) => {
	const actual = await importOriginal<typeof import('randmatqugea/src/modules/Trigonometry/GenerateGeneralSolutions')>();
	return { ...actual, generateGeneralSolutions: vi.fn(actual.generateGeneralSolutions) };
});

const LEVELS = ['easy', 'medium', 'hard'];
const SAMPLES = 100;

function evaluateLatex(latex: string): number {
	let s = latex.replace(/\s+/g, '');
	let previous: string;
	do {
		previous = s;
		s = s
			.replace(/\\sqrt\{([^{}]*)\}/g, 'Math.sqrt($1)')
			.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
	} while (s !== previous);
	return Function(`"use strict"; return (${s});`)() as number;
}

function trigValue(expression: string): number {
	const match = expression.trim().match(/^\\(sin|cos|tan|csc|sec|cot)\\left\((-?\d+)\^\{\\circ\}\\right\)$/);
	if (!match) throw new Error(`Unrecognised expression: ${expression}`);
	const radians = (parseInt(match[2], 10) * Math.PI) / 180;
	const functions: Record<string, (x: number) => number> = {
		sin: Math.sin,
		cos: Math.cos,
		tan: Math.tan,
		csc: (x) => 1 / Math.sin(x),
		sec: (x) => 1 / Math.cos(x),
		cot: (x) => 1 / Math.tan(x),
	};
	return functions[match[1]](radians);
}

describe.each([
	['MatchingGameQuestionSource', () => new MatchingGameQuestionSource()],
	['LockGameQuestionSource', () => new LockGameQuestionSource()],
])('%s difficulty handling', (_name, create) => {
	it('defaults to easy when no difficulty is given', () => {
		expect(create().getQuestion().difficulty).toBe('easy');
	});

	it('accepts difficulty in any letter case and reports it in lower case', () => {
		expect(create().getQuestion('HARD').difficulty).toBe('hard');
		expect(create().getQuestion('Medium').difficulty).toBe('medium');
	});

	it('throws on an unknown difficulty', () => {
		expect(() => create().getQuestion('ablbagjlas')).toThrow('Unknown difficulty');
	});
});

describe('MatchingGameQuestionSource', () => {
	const source = new MatchingGameQuestionSource();

	it('returns the requested difficulty', () => {
		for (const level of LEVELS) {
			expect(source.getQuestion(level).difficulty).toBe(level);
		}
	});

	it('returns a non-empty prompt and answer', () => {
		for (const level of LEVELS) {
			for (let i = 0; i < SAMPLES; i++) {
				const { prompt, answer } = source.getQuestion(level);
				expect(prompt.length).toBeGreaterThan(0);
				expect(answer.length).toBeGreaterThan(0);
			}
		}
	});

	it('returns the exact value that the expression really equals', () => {
		for (const level of LEVELS) {
			for (let i = 0; i < SAMPLES; i++) {
				const { prompt, answer } = source.getQuestion(level);
				expect(evaluateLatex(answer)).toBeCloseTo(trigValue(prompt), 9);
			}
		}
	});

	it('does not always return the same pair', () => {
		const prompts = new Set<string>();
		for (let i = 0; i < SAMPLES; i++) {
			prompts.add(source.getQuestion('hard').prompt);
		}
		expect(prompts.size).toBeGreaterThan(5);
	});

	it('throws if the library output has no "=" to split on', () => {
		vi.mocked(generateExactValues).mockReturnValueOnce({ display: 'no equals sign here' } as never);
		expect(() => source.getQuestion('easy')).toThrow('Unexpected exact-value format');
	});

	it('throws if the library output has nothing on one side of the "="', () => {
		vi.mocked(generateExactValues).mockReturnValueOnce({ display: '\\sin(30^{\\circ})=' } as never);
		expect(() => source.getQuestion('easy')).toThrow('Unexpected exact-value format');
	});
});

describe('LockGameQuestionSource', () => {
	const source = new LockGameQuestionSource();

	// the general solutions the library currently produces, and the combination each should give
	const KNOWN_SOLUTIONS: [string, number[]][] = [
		['x = n\\pi', [12, 6, 12, 6]],
		['x = \\frac{\\pi}{2} + n\\pi', [3, 9, 3, 9]],
		['x = \\frac{\\pi}{4} + n\\pi', [2, 8, 2, 8]],
		['x = \\frac{\\pi}{3} + n\\pi', [2, 8, 2, 8]],
		['x = n\\pi + (-1)^{n}\\frac{\\pi}{6}', [1, 5, 1, 5]],
		['x = n\\pi + (-1)^{n}\\frac{\\pi}{3}', [2, 4, 2, 4]],
		['x = \\frac{2\\pi}{3} + 2n\\pi \\text{ or } x = \\frac{4\\pi}{3} + 2n\\pi', [4, 8, 4, 8]],
	];

	function fakeQuestion(correct: string, extra: object = {}) {
		return { latex: 'Solve \\( \\tan(x) = 1 \\)', correct, subskill: 'all_solutions', ...extra } as never;
	}

	it('returns 4 whole-number lock positions between 1 and 12', () => {
		for (const level of LEVELS) {
			for (let i = 0; i < SAMPLES; i++) {
				const { lockNumbers } = source.getQuestion(level);
				expect(lockNumbers).toHaveLength(4);
				for (const n of lockNumbers) {
					expect(Number.isInteger(n)).toBe(true);
					expect(n).toBeGreaterThanOrEqual(1);
					expect(n).toBeLessThanOrEqual(12);
				}
			}
		}
	});

	it('recognises every solution format the library currently produces', () => {
		const known = KNOWN_SOLUTIONS.map(([answer]) => answer);
		for (const level of LEVELS) {
			for (let i = 0; i < SAMPLES; i++) {
				expect(known).toContain(source.getQuestion(level).answer);
			}
		}
	});

	it.each(KNOWN_SOLUTIONS)('maps the solution "%s" to its lock combination', (answer, expected) => {
		vi.mocked(generateGeneralSolutions).mockReturnValueOnce(fakeQuestion(answer));
		expect(source.getQuestion('easy').lockNumbers).toEqual(expected);
	});

	it('falls back to [3, 6, 9, 12] for a solution it does not recognise', () => {
		vi.mocked(generateGeneralSolutions).mockReturnValueOnce(fakeQuestion('x = 7\\pi'));
		expect(source.getQuestion('easy').lockNumbers).toEqual([3, 6, 9, 12]);
	});

	it('keeps asking the library until it gets an "all solutions" question', () => {
		const mock = vi.mocked(generateGeneralSolutions);
		mock.mockClear();
		mock.mockReturnValueOnce(fakeQuestion('x = 0', { subskill: 'something_else' }));
		mock.mockReturnValueOnce(fakeQuestion('x = n\\pi'));
		const question = source.getQuestion('easy');
		expect(mock).toHaveBeenCalledTimes(2);
		expect(question.answer).toBe('x = n\\pi');
	});

	it('uses only the equation from the prompt text', () => {
		vi.mocked(generateGeneralSolutions).mockReturnValueOnce(
			fakeQuestion('x = n\\pi', { latex: 'Find all solutions of \\( \\sin(x) = 0 \\) over the reals.' }),
		);
		expect(source.getQuestion('easy').prompt).toBe('\\sin(x) = 0');
	});

	it('uses the whole prompt when it has no equation delimiters', () => {
		vi.mocked(generateGeneralSolutions).mockReturnValueOnce(
			fakeQuestion('x = n\\pi', { latex: 'sin x equals zero' }),
		);
		expect(source.getQuestion('easy').prompt).toBe('sin x equals zero');
	});

	it('returns the library answer unchanged', () => {
		vi.mocked(generateGeneralSolutions).mockReturnValueOnce(fakeQuestion('x = \\frac{\\pi}{4} + n\\pi'));
		expect(source.getQuestion('hard').answer).toBe('x = \\frac{\\pi}{4} + n\\pi');
	});
});