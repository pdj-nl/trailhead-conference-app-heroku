var jsforce = require('jsforce');

console.info('Env ON_HEROKU',process.env.ON_HEROKU);
if (process.env.ON_HEROKU === 'false') {
    console.info('Using dotenv');
    require('dotenv').config();
}

const HOST = process.env.BACKEND_BIND_HOST || 'localhost';
const PORT = process.env.BACKEND_PORT || 3002;

const { API_KEY, SF_LOGIN_URL, SF_USERNAME, SF_PASSWORD, SF_TOKEN } = process.env;
if (!(API_KEY && SF_USERNAME && SF_PASSWORD && SF_TOKEN && SF_LOGIN_URL)) {
    console.error(
        'Cannot start app: missing mandatory configuration. Check your .env file.'
    );
    process.exit(-1);
}

const conn = new jsforce.Connection({
    loginUrl: SF_LOGIN_URL
});
conn.login(SF_USERNAME, SF_PASSWORD + SF_TOKEN, function(err, userInfo) {
  if (err) { return console.error(err); }
  // Now you can get the access token and instance URL information.
  // Save them to establish connection next time..
  console.log(conn.accessToken);
  console.log(conn.instanceUrl);
  // logged in user property
  console.log("User ID: " + userInfo.id);
  console.log("Org ID: " + userInfo.organizationId);
});

const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const app = express();
app.use(helmet());
app.use(compression());

app.get('/api/sessions', (req, res) => {
    const soql = `SELECT Id, Name, toLabel(Room__c), Description__c, format(Date_and_Time__c) formattedDateTime,
        (SELECT Speaker__r.Id, Speaker__r.Name, Speaker__r.Description, Speaker__r.Email, Speaker__r.Picture_URL__c FROM Session_Speakers__r)
        FROM Session__c ORDER BY Date_and_Time__c LIMIT 100`;
    conn.query(soql, (err, result) => {
        if (err) {
            res.sendStatus(500);
        } else if (result.records.length === 0) {
            res.status(404).send('Session not found.');
        } else {
            const formattedData = result.records.map(sessionRecord => {
                let speakers = [];
                if(sessionRecord.Session_Speakers__r){
                    speakers = sessionRecord.Session_Speakers__r.records.map(
                        record => {
                            return {
                                id: record.Speaker__r.Id,
                                name: record.Speaker__r.Name,
                                email: record.Speaker__r.Email,
                                bio: record.Speaker__r.Description,
                                pictureUrl: record.Speaker__r.Picture_URL__c
                            };
                        }
                    );
                }
                return {
                    id: sessionRecord.Id,
                    name: sessionRecord.Name,
                    dateTime: sessionRecord.formattedDateTime,
                    room: sessionRecord.Room__c,
                    description: sessionRecord.Description__c,
                    speakers
                };
            });
            res.send({ data: formattedData });
        }
    });
});

app.listen(PORT, HOST, () =>
    console.log(
        `✅  API Server started: http://${HOST}:${PORT}/api/sessions`
    )
);
