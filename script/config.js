// GitHub API Configuration
const apiUrl = 'https://api.github.com/users/euclides-marques/repos?per_page=100';
const fetchOptions = {
    headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Uncomment and add your GitHub token if you hit rate limits
        // 'Authorization': 'token YOUR_GITHUB_TOKEN'
    }
};
