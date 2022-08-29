const { removeTabsAndReturns, convertFractionToFloat } = require('../../helpers/recipes.js');

/**
 * removeTabsAndReturns tests
 */
test('removes tabs and returns', () => {
    expect(removeTabsAndReturns("test\n\n\t\ttest\t\t\n\n")).toBe("testtest");
});

test('only tabs will be empty string', () => {
    expect(removeTabsAndReturns("\n\t\n\t")).toBe("");
});

test('removes tabs in middle of word', () => {
    expect(removeTabsAndReturns("te\tst")).toBe("test");
});

test('removes carriage returns in middle of word', () => {
    expect(removeTabsAndReturns("te\nst")).toBe("test");
});

/**
 * convertFractionToFloat tests
 */
test('1/4 is 0.25', () => {
    expect(convertFractionToFloat("1/4")).toBe(0.25);
});

test('1 and 1/4 is 1.25', () => {
    expect(convertFractionToFloat("1/4")).toBe(0.25);
});

test('whitespace is whitespace', () => {
    expect(convertFractionToFloat(" ")).toBe(" ");
});