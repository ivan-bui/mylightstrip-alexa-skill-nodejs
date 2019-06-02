'use strict';
const request = require('request');
const url = require('url');
const Alexa = require('ask-sdk-core');

const APP_NAME = 'My Lightstrip';
const SERVER_URL = ''

//code for the handlers
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        //welcome message
        let speechText = 'Welcome to My Lightstrip by Ivan Bui';
        //welcome screen message
        let displayText = "Welcome to My Lightstrip by Ivan Bui"
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard(APP_NAME, displayText)
            .getResponse();
    }
};

const ChangeColourIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ChangeColourIntent';
    },
    handle(handlerInput) {
        let speechText = 'Ok, changing light strip to ';
        let intent = handlerInput.requestEnvelope.request.intent;
        let intentColor = intent.slots.colour.value;
        if (intentColor) {
            ChangeColour(intentColor);
        } else {
            return handlerInput.responseBuilder
            .addDelegateDirective(intent)
            .withSimpleCard(APP_NAME, '')
            .getResponse();
        }
        return handlerInput.responseBuilder
            .speak(speechText + intentColor)
            .withSimpleCard(APP_NAME, speechText)
            .withShouldEndSession(false)
            .getResponse();
    }
};

const BrightnessIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'IncreaseBrightnessPercentageIntent'
            || handlerInput.requestEnvelope.request.intent.name === 'BrightnessToIntent'
            || handlerInput.requestEnvelope.request.intent.name === 'DecreaseBrightnessPercentageIntent');
    },
    async handle(handlerInput) {
        let speechText = 'Ok, changing brightness';
        let intent = handlerInput.requestEnvelope.request.intent;
        let brightness = intent.slots.brightness.value;
        
        if (brightness) {
            brightness /= 100;
            console.log(brightness);
            if (handlerInput.requestEnvelope.request.intent.name === 'IncreaseBrightnessPercentageIntent') {
                await GetCurrentBrightness().then(currentBrightness => {
                    brightness += 1;
                    brightness *= currentBrightness.brightness;
                    brightness /= 255;
                    speechText = 'Ok, increasing brightness';
                });
            } else if (handlerInput.requestEnvelope.request.intent.name === 'DecreaseBrightnessPercentageIntent') {
                await GetCurrentBrightness().then(currentBrightness => {
                    brightness = 1 - brightness;
                    brightness *= currentBrightness.brightness;
                    brightness /= 255;
                    speechText = 'Ok, dimming light strip';
                });
            }
            ChangeBrightness(brightness);
        } else {
            return handlerInput.responseBuilder
                        .addDelegateDirective(intent)
                        .withSimpleCard(APP_NAME, '')
                        .getResponse();
        }
        return handlerInput.responseBuilder
                            .speak(speechText)
                            .withSimpleCard(APP_NAME, speechText)
                            .withShouldEndSession(false)
                            .getResponse();
    }
};

function ChangeColour(colour, callback) {
    request.post({
        url:SERVER_URL, 
        form: { 'colour' : colour }
    }, function(error, httpResponse, body) { 
        if(callback) {
            callback(error, JSON.parse(body))
        }
    });
}

function GetCurrentBrightness() {
    return new Promise(function(resolve, reject) {
        request(SERVER_URL, function (error, response, body) {
          if (error) {
            reject(error);
          } else {
            resolve(JSON.parse(body));
          }
        });
    });
}

function ChangeBrightness(brightnessValue, callback) {
    request.post({
        url: SERVER_URL, 
        form: { 'brightness' : brightnessValue }
    }, function(error, httpResponse, body) { 
        if(callback) {
            callback(error, JSON.parse(body))
        }
    });
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        //help text for your skill
        let speechText = '';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard(APP_NAME, speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        ChangeBrightness(0);
        let speechText = 'Goodbye';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard(APP_NAME, speechText)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        //any cleanup logic goes here
        return handlerInput.responseBuilder.getResponse();
    }
};

//Lambda handler function
//Remember to add custom request handlers here
exports.handler = Alexa.SkillBuilders.custom()
     .addRequestHandlers(LaunchRequestHandler,
                         ChangeColourIntentHandler,
                         BrightnessIntentHandler,
                         HelpIntentHandler,
                         CancelAndStopIntentHandler,
                         SessionEndedRequestHandler).lambda();
