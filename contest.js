import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    stages: [
        { duration: '3s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '2m', target: 100 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:12345';

let headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
};

// Helper functions
function generateUser() {
    return `gatling${randomString(5)}`;
}

function getFormToken(body, tokenName) {
    const regex = new RegExp(`<input type="hidden"[^>]*name="${tokenName}"[^>]*value="([^"]*)">`);
    const match = body.match(regex);
    return match ? match[1] : null;
}

// User actions
function login(username, password) {
    let res = http.get(`${BASE_URL}/login`);

    check(res, {
        'login page retrieved': (r) => r.status === 200,
    });

    let csrfToken = res.html().find('input[name="_csrf_token"]').attr('value');

    check(csrfToken, {
        'CSRF token found': (token) => token !== '',
    });

    let loginPayload = {
        _username: username,
        _password: password,
        _csrf_token: csrfToken,
    };

    let loginHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    let loginRes = http.post(`${BASE_URL}/login`, loginPayload, { headers: loginHeaders });

    let loginSuccess = check(loginRes, {
        'login success': (r) => r.status === 200,
    });

    if (!loginSuccess) {
        console.log(`Login failed for user: ${username}`);
        return;
    }
}

function register(username, password) {
    const regPage = http.get(`${BASE_URL}/register`);

    let csrfToken = regPage.html().find('input[name="user_registration[_token]"]').attr('value');

    const regRes = http.post(`${BASE_URL}/register`, {
        'user_registration[username]': username,
        'user_registration[name]': username,
        'user_registration[teamName]': username,
        'user_registration[plainPassword][first]': password,
        'user_registration[plainPassword][second]': password,
        'user_registration[existingAffiliation]': '1',
        'user_registration[_token]': csrfToken,
    }, { headers });

    let regSuccess = check(regRes, {
        'register success': (r) => r.status === 200,
    });

    if (!regSuccess) {
        console.log(`Registration failed for user: ${username}`);
        return;
    }
}

function submitSolution(langId, filename) {
    const submitPage = http.get(`${BASE_URL}/team/submit`);
    const csrfToken = submitPage.html().find('input[name="submit_problem[_token]"]').attr('value');
    const problemId = submitPage.body.match(/<option value="([^"]*)">A - /)[1];

    const submitRes = http.post(`${BASE_URL}/team/submit`, {
        'submit_problem[_token]': csrfToken,
        'submit_problem[problem]': problemId,
        'submit_problem[language]': langId,
        'submit_problem[code][]': http.file(filename),
        'submit': '',
    });

    check(submitRes, {
        'Submission failed': (r) => r.status === 200,
    });
}

function requestClarification(username) {
    const clarPage = http.get(`${BASE_URL}/team/clarifications/add`);
    const csrfToken = clarPage.html().find('input[name="team_clarification[_token]"]').attr('value');
    const subjectId = clarPage.body.match(/<option value="([^"]*-general)">General/)[1];

    const clarificationRes = http.post(`${BASE_URL}/team/clarifications/add`, {
        'team_clarification[recipient]': 'dummy',
        'team_clarification[subject]': subjectId,
        'team_clarification[message]': `${username} needs help`,
        'team_clarification[_token]': csrfToken,
        'submit': '',
    });

    check(clarificationRes, {
        'Submission failed': (r) => r.status === 200,
    });
}

// Main scenario
export default function () {
    const username = generateUser();
    const password = username; // For simplicity, using the same value for password

    group('Contest simulation', function () {
        register(username, password);

        login(username, password);

        sleep(2);

        const res = http.get(`${BASE_URL}/team/`);
        sleep(5);

        submitSolution('java', 'test-hello.java');
        sleep(10);

        http.get(`${BASE_URL}/team/scoreboard`);
        sleep(10);

        http.get(`${BASE_URL}/team/team/${username}`);
        sleep(5);

        requestClarification(username);
        sleep(6);

        submitSolution('c', 'test-hello.c');
        sleep(15);

        submitSolution('py2', 'test-hello.py2');
        sleep(8);

        submitSolution('hs', 'test-hello.hs');
        sleep(5);

        http.get(`${BASE_URL}/team/scoreboard`);
        sleep(8);
    });
}

// Spectator scenario
export function spectator() {
    http.get(`${BASE_URL}/public/`);
    sleep(30);
}
