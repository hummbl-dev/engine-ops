// Suppress console output during tests to prevent CI failures
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'info').mockImplementation(() => { });
});

afterAll(() => {
    jest.restoreAllMocks();
});
