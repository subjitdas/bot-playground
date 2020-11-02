// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { MessageFactory } = require('botbuilder');
const { ActionTypes } = require('botframework-schema');

const { DialogBot } = require('./laptopBot');

class SuggestedActionsBot extends DialogBot {
    constructor(conversationState, userState, dialog) {
        super(conversationState, userState, dialog);

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {
            const text = context.activity.text;

            // Create an array with the valid color options.
            const validInput = ['Buy a laptop', 'Plan a trip'];

            // If the `text` is in the Array, a valid color was selected and send agreement.
            if (validInput.includes(text)) {
                // await context.sendActivity(`Great you'd like to ${ text.toLowerCase() }.`);
                // if(text == 'Buy a laptop') {

                // }
            } else {
                await context.sendActivity('Please select an option.');
                // After the bot has responded send the suggested actions.
                await this.sendSuggestedActions(context);
            }


            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    /**
     * Send a welcome message along with suggested actions for the user to click.
     * @param {TurnContext} turnContext A TurnContext instance containing all the data needed for processing this conversation turn.
     */
    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext;

        // Iterate over all new members added to the conversation.
        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const welcomeMessage = `Welcome ${ activity.membersAdded[idx].name }. `;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    /**
     * Send suggested actions to the user.
     * @param {TurnContext} turnContext A TurnContext instance containing all the data needed for processing this conversation turn.
     */
    async sendSuggestedActions(turnContext) {
        const cardActions = [
            {
                type: ActionTypes.PostBack,
                title: 'Buy a laptop',
                value: 'Buy a laptop',
                image: 'http://clipart-library.com/images/BTaEz6eGc.png',
                imageAltText: 'Laptop'
            },
            {
                type: ActionTypes.PostBack,
                title: 'Plan a trip',
                value: 'Plan a trip',
                image: 'http://clipart-library.com/img1/1523462.png',
                imageAltText: 'Trip'
            }
        ];

        var reply = MessageFactory.suggestedActions(cardActions, 'What would you like to do?');
        await turnContext.sendActivity(reply);
    }
}

module.exports.SuggestedActionsBot = SuggestedActionsBot;