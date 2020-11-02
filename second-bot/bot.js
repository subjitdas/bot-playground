// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, CardFactory } = require('botbuilder');

const gmailLoginCard = require('./resources/GmailLogin.json');

class AdaptiveCardsBot extends ActivityHandler {
    constructor() {
        super();
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(`Welcome to Adaptive Cards Bot  ${ membersAdded[cnt].name }.`);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {
            const activity = context.activity;
            if(!activity.value) {
                await context.sendActivity({
                    text: 'Enter your credentials:',
                    attachments: [CardFactory.adaptiveCard(gmailLoginCard)]
                });
            }
            else {
                console.log(activity.value.userEmail, activity.value.userPassword);
                await context.sendActivity(`Your credentials are ${activity.value.userEmail} & ${activity.value.userPassword}`);
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.AdaptiveCardsBot = AdaptiveCardsBot;
