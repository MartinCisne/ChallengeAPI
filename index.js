const { v4: uuidv4 } = require('uuid');
const { IamAuthenticator } = require('ibm-watson/auth');
const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const app = express();

const PersonalityInsights = require('ibm-watson/personality-insights/v3');
const personalityInsights = new PersonalityInsights({
    authenticator: new IamAuthenticator({ apikey: '8i4TCL3oQ6ebWOYK5TwTYzU5xpVNjbdSZ_GHfHA0EcGd' }),
    version: '2020-07-06',
    url: 'https://api.us-south.personality-insights.watson.cloud.ibm.com/instances/bf1c9436-476f-441b-be06-f398f77799da'
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/' , (req, res) => {
    res.send('Welcome to Challenge')
});

app.post('/pi/profile' , (req, res) => {

    let responseMessage = req.body['content'];

    personalityInsights.profile(
        {
          content: responseMessage,
          contentType: 'text/plain',
          consumptionPreferences: true
        })
        .then(response => {

            AWS.config.getCredentials(function(err) {
                if (err) console.log(err.stack);
                // credentials not loaded
                else {
                  console.log("Access key:", AWS.config.credentials.accessKeyId);
                }
              });
           
            AWS.config.update({region: 'us-east-2'});

            let documentClient = new AWS.DynamoDB.DocumentClient();
            let uniqueID = uuidv4();

                let params = {
                    TableName : 'IBM_RESPONSE',
                    Item: {
                        UUID: uniqueID,
                        word_count: response.result.word_count,
                        word_count_message: response.result.word_count_message,
                        processed_language: response.result.processed_language,
                        personality: response.result.personality,
                        needs: response.result.needs,
                        values: response.result.values,
                        consumption_preferences: response.result.consumption_preferences,
                        warnings: response.result.warnings
                    }
                }

                documentClient.put(params, function(err, data) {
                    if (err) {

                        console.log("Error", err);
                        res.status(400).send('Error: '+ err.body);
                
                    } else {
                
                        console.log("Success Database Put Item", data);
                        res.status(200).send('Success Database Put Item');
                
                    }
                  });


                    for(let personality of response.result.personality){
                        let documentClient = new AWS.DynamoDB.DocumentClient();
                        let uniqueID = uuidv4();

                        let params = {
                            TableName : 'PERSONALITY',
                            Item: {
                                UUID: uniqueID,
                                trait_id: personality.trait_id,
                                name: personality.name,
                                category: personality.category,
                                percentile: personality.percentile,
                                significant: personality.significant,
                                children: personality.children
                            }
                        }

                        documentClient.put(params, function(err, data) {
                            if (err) console.log(err);
                        });
                    }

                    for(let need of response.result.needs){
                        let documentClient = new AWS.DynamoDB.DocumentClient();
                        let uniqueID = uuidv4();

                        let params = {
                            TableName : 'NEEDS',
                            Item: {
                                UUID: uniqueID,
                                trait_id: need.trait_id,
                                name: need.name,
                                category: need.category,
                                percentile: need.percentile,
                                significant: need.significant
                            }
                        }

                        documentClient.put(params, function(err, data) {
                            if (err) console.log(err);
                        });
                        }

                    for(let value of response.result.values){
                        let documentClient = new AWS.DynamoDB.DocumentClient();
                        let uniqueID = uuidv4();

                        let params = {
                            TableName : 'VALUES',
                            Item: {
                                UUID: uniqueID,
                                trait_id: value.trait_id,
                                name: value.name,
                                category: value.category,
                                percentile: value.percentile,
                                significant: value.significant
                            }
                        }
        
                        documentClient.put(params, function(err, data) {
                            if (err) console.log(err);
                        });
                        }        

                    for(let consumptionPreference of response.result.consumption_preferences){
                        let documentClient = new AWS.DynamoDB.DocumentClient();
                        let uniqueID = uuidv4();

                        let params = {
                            TableName : 'CONSUPTION_PREFERENCES',
                            Item: {
                                UUID:uniqueID,
                                consumption_preference_category_id: consumptionPreference.consumption_preference_category_id,
                                name: consumptionPreference.name,
                                consumption_preferences: consumptionPreference.consumption_preferences
                            }
                        }

                        documentClient.put(params, function(err, data) {
                            if (err) console.log(err);
                          });
                    }

                    for(let warn of response.result.warnings){
                        let documentClient = new AWS.DynamoDB.DocumentClient();
                        let uniqueID = uuidv4();

                        let params = {
                            TableName : 'WARNING',
                            Item: {
                                UUID: uniqueID,
                                warning_id: warn.warning_id,
                                message: warn.message
                            }
                        }

                        documentClient.put(params, function(err, data) {
                            if (err) console.log(err);
                          });
                    }
        })
        .catch(err => {
          console.log('error: ', err);
          res.status(400).send('Error: '+ err.body);
        });
})

app.listen(3000, () => {
    console.log('Server Running')
});