const axios = require('axios');
const cheerio = require('cheerio');
const Promise = require('bluebird');
const qs = require('qs');

const BASE_URL = 'https://test2.indiaicpc.in'; // Replace with the actual base URL
const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'cookie': 'domjudge_refresh=1; domjudge_scorefilter=%5B%5D; PHPSESSID=gb5t9ni8vi3nfvd6phmcduuk1u', 

    // Add other headers like User-Agent, cookies, etc.
};

async function register(username, password) {
    try {
        // GET request to fetch the registration page
        const regPage = await axios.get(`${BASE_URL}/register`, { headers });

        // Load the HTML to extract the CSRF token using cheerio
        const $ = cheerio.load(regPage.data);
        const csrfToken = $('input[name="user_registration[_token]"]').val();


        // POST request to register the user
        let data = qs.stringify({
            'user_registration[username]': username,
            'user_registration[name]': username,
            'user_registration[teamName]': username,
            'user_registration[affiliation]': 'none',
            'user_registration[affiliationName]': '',
            'user_registration[affiliationShortName]': '',
            'user_registration[affiliationCountry]': '',
            'user_registration[existingAffiliation]': '',
            'user_registration[plainPassword][first]': username,
            'user_registration[plainPassword][second]': username,
            'user_registration[submit]': '',
            'user_registration[_token]': csrfToken,
        });

        const regRes = await axios.request(
            { 
                method: 'post',
                url: `${BASE_URL}/register`,
                data,
                headers 
            });

        // Check if registration was successful
        if (regRes.status === 200) {
            console.log(`Registration successful for user: ${username}`);
        } else {
            console.log(`Registration failed for user: ${username}`);
        }
    } catch (error) {
        console.error(`Error during registration for user: ${username}`, error);
    }
}

function generateUser(i) {
    return `gatling_reg_${i}`;
}


(async () => {
    const a = [];
    for (let i = 0; i < 4000; i++) {
        a.push(i);
    }
    let cnt = 0;

    await Promise.map(a, async (x) => {
        await register(generateUser(x), generateUser(x));
        cnt++;
        console.log('Created: ', cnt);
    }, { concurrency: 50 });
})()
.then(() => {})
.catch(err => console.log(err));
