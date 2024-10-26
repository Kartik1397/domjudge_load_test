/*
0 to 35 min

0 to 5: login


const res = http.get(`${BASE_URL}/team/`);

5 sec

https://test.indiaicpc.in/team/problems

5 sec

https://test.indiaicpc.in/team/problems/1/text

5 sec

https://test.indiaicpc.in/team/1/samples.zip

between 5 to 10min check scoreboard

randomly between: 5 to 15 min
submitSolution('java', java);

between 5 to 10min check scoreboard

10 sec

http.get(`${BASE_URL}/team/scoreboard`);

const res = http.get(`${BASE_URL}/team/`);

5 sec

https://test.indiaicpc.in/team/problems

5 sec

https://test.indiaicpc.in/team/problems/1/text

5 sec

https://test.indiaicpc.in/team/1/samples.zip

between 5 to 10min check scoreboard

randomly between: 5 to 15 min
submitSolution('java', java);

between 5 to 10min check scoreboard

10 sec

http.get(`${BASE_URL}/team/scoreboard`);
*/
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { randomstring } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { formdata } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

const java = open('bodies/test-hello.java', 'b');
const c = open('bodies/test-hello.c', 'b');

export const options = {
    stages: [
        { duration: '5m', target: 10000 },
        { duration: '30m', target: 10000 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    },
};

const base_url = __env.base_url || 'http://localhost:12345';

const headers = {
    'content-type': 'application/x-www-form-urlencoded',
};

// helper functions
function generateuser() {
    return `gatling_reg_${Math.ceil(Math.random() * 5000) % 5000}`
}

// user actions
function login(username, password) {
    let res = http.get(`${base_url}/login`);

    check(res, {
        'login page retrieved': (r) => r.status === 200,
    });

    let csrftoken = res.html().find('input[name="_csrf_token"]').attr('value');

    check(csrftoken, {
        'csrf token found': (token) => token !== '',
    });

    let loginpayload = {
        _username: username,
        _password: password,
        _csrf_token: csrftoken,
    };

    let loginres = http.post(`${base_url}/login`, loginpayload, { headers });

    let loginsuccess = check(loginres, {
        'login success': (r) => r.status === 200,
    });

    if (!loginsuccess) {
        console.log(`login failed for user: ${username}`);
        return;
    }
}

function register(username, password) {
    const regpage = http.get(`${base_url}/register`);

    let csrftoken = regpage.html().find('input[name="user_registration[_token]"]').attr('value');

    const regres = http.post(`${base_url}/register`, {
        'user_registration[username]': username,
        'user_registration[name]': username,
        'user_registration[teamname]': username,
        'user_registration[plainpassword][first]': password,
        'user_registration[plainpassword][second]': password,
        'user_registration[existingaffiliation]': '1',
        'user_registration[_token]': csrftoken,
    }, { headers });

    let regsuccess = check(regres, {
        'register success': (r) => r.status === 200,
    });

    if (!regsuccess) {
        console.log(`registration failed for user: ${username}`);
        return;
    }
}

function submitsolution(langid, file) {
    const submitpage = http.get(`${base_url}/team/submit`);
    const csrftoken = submitpage.html().find('input[name="submit_problem[_token]"]').attr('value');
    const problemid = submitpage.body.match(/<option value="([^"]*)">a - /)[1];

    const fd = new formdata();
    fd.append('submit_problem[_token]', csrftoken);
    fd.append('submit_problem[problem]', problemid);
    fd.append('submit_problem[language]', langid);
    fd.append('submit_problem[code][]', http.file(file, `${langid}.${langid}`, 'text/plain'));
    fd.append('submit', '');

    const submitres = http.post(
        `${base_url}/team/submit`,
        fd.body(),
        {
            headers: { 'content-type': 'multipart/form-data; boundary=' + fd.boundary },
        }
    );

    check(submitres, {
        'submit solution success': (r) => r.status === 200,
    });
}

function requestclarification(username) {
    const clarpage = http.get(`${base_url}/team/clarifications/add`);
    const csrftoken = clarpage.html().find('input[name="team_clarification[_token]"]').attr('value');
    const subjectid = clarpage.body.match(/<option value="([^"]*-general)">general/)[1];

    const clarificationres = http.post(`${base_url}/team/clarifications/add`, {
        'team_clarification[recipient]': 'dummy',
        'team_clarification[subject]': subjectid,
        'team_clarification[message]': `${username} needs help`,
        'team_clarification[_token]': csrftoken,
        'submit': '',
    });

    check(clarificationres, {
        'request clarification success': (r) => r.status === 200,
    });
}

// main scenario
export default function () {
    const username = generateuser();
    const password = username; // for simplicity, using the same value for password

    group('contest simulation', function () {
        login(username, password);

        sleep(5);

        const res = http.get(`${base_url}/team/`);

        sleep(5);
        const res = http.get(`${base_url}/team/problems`);

        sleep(5);
        const res = http.get(`${base_url}/team/problems/1/text`);

        sleep(5);
        const res = http.get(`${base_url}/team/1/samples.zip`);

        setTimeout(() => {
            sleep(5);
            http.get(`${base_url}/team/scoreboard`);
        }, 5 * 60 * 1000 + Math.random() * 5 * 60 * 1000);

        sleep(5 * 60 * 1000 + Math.random() * 10 * 60 * 1000);
        submitsolution('java', java);

        sleep(10);
        http.get(`${base_url}/team/scoreboard`);

        sleep(5);

        const res = http.get(`${base_url}/team/`);

        sleep(5);
        const res = http.get(`${base_url}/team/problems`);

        sleep(5);
        const res = http.get(`${base_url}/team/problems/1/text`);

        sleep(5);
        const res = http.get(`${base_url}/team/1/samples.zip`);

        setTimeout(() => {
            sleep(5);
            http.get(`${base_url}/team/scoreboard`);
        }, 5 * 60 * 1000 + Math.random() * 5 * 60 * 1000);

        sleep(5 * 60 * 1000 + Math.random() * 20 * 60 * 1000);
        submitsolution('java', java);

        sleep(10);
        http.get(`${base_url}/team/scoreboard`);
    });
}

