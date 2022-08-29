const { objectNotEmpty, isNullOrWhitespace, roundDecimalPlaces } = require('../../helpers/helpers.js');

/**
 * objectNotEmpty tests
 */
test('object is empty', () => {
    expect(objectNotEmpty({})).toBe(false);
});

test('object is not empty', () => {
    expect(objectNotEmpty({ test: "test" })).toBe(true);
});

test('object containing null is not empty', () => {
    expect(objectNotEmpty({ test: null })).toBe(true);
});

test('object is empty because it\'s not an object', () => {
    expect(objectNotEmpty("not an object")).toBe(false);
});

/**
 * isNullOrWhitespace tests
 */
test('empty string is null or whitespace', () => {
    expect(isNullOrWhitespace("")).toBe(true);
});

test('null is null or whitespace', () => {
    expect(isNullOrWhitespace(null)).toBe(true);
});

test('space is null or whitespace', () => {
    expect(isNullOrWhitespace(" ")).toBe(true);
});

test('tab is null or whitespace', () => {
    expect(isNullOrWhitespace(" ")).toBe(true);
});

test('carriage return is null or whitespace', () => {
    expect(isNullOrWhitespace("\n")).toBe(true);
});

test('sentence is not null or whitespace', () => {
    expect(isNullOrWhitespace("hello")).toBe(false);
});

/**
 * roundDecimalPlaces tests
 */
test('3.55555 rounds to 3.56', () => {
    expect(roundDecimalPlaces(3.55555, 2)).toBe(3.56);
});

test('0 rounds to 0', () => {
    expect(roundDecimalPlaces(0, 2)).toBe(0);
});

test('1.1 rounds to 1.1', () => {
    expect(roundDecimalPlaces(1.1, 2)).toBe(1.1);
});