// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { MessageFactory } = require('botbuilder');
const { ActionTypes } = require('botframework-schema');
const { CardFactory } = require('botbuilder');

const {
    ChoiceFactory,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog,
    ChoicePrompt
} = require('botbuilder-dialogs');
const { SlotDetails } = require('./slotDetails');
const { SlotFillingDialog } = require('./slotFillingDialog');

const laptopCard = require('../resources/LaptopCard.json');
const tripCard = require('../resources/TripCard.json');

const CHOICE_PROMPT = 'CHOICE_PROMPT';

class RootDialog extends ComponentDialog {
    /**
     * SampleBot defines the core business logic of this bot.
     * @param {ConversationState} conversationState A ConversationState object used to store dialog state.
     */
    constructor(userState) {
        super('root');
        // Create a property used to store dialog state.
        // See https://aka.ms/about-bot-state-accessors to learn more about bot state and state accessors.
        this.userStateAccessor = userState.createProperty('result');

        // Set up a series of questions for collecting data in case user wants to buy laptop.
        const laptopDetailsSlots = [
            new SlotDetails('company', 'text', 'Enter the company name of the laptop.'),
            new SlotDetails('colour', 'text', 'Enter the colour of laptop.'),
            new SlotDetails('purpose', 'text', 'Enter the purpose of buying a laptop'),
            new SlotDetails('budget', 'text', 'Enter the budget of your laptop')
        ];

        // Set up a series of questions to collect data in case user wants to go on a trip.
        const tripDetailsSlots = [
            new SlotDetails('country', 'text', 'Please enter the country you want to vist.'),
            new SlotDetails('state', 'text', 'Please enter the state you want to visit.'),
            new SlotDetails('days', 'text', 'Please enter the number of days of trip.'),
            new SlotDetails('budget', 'text', 'Please enter your budget')
        ];

        // Add the individual child dialogs and prompts used.
        // Note that the built-in prompts work hand-in-hand with our custom SlotFillingDialog class
        // because they are both based on the provided Dialog class.
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new SlotFillingDialog('laptop', laptopDetailsSlots));
        this.addDialog(new SlotFillingDialog('trip', tripDetailsSlots));
        this.addDialog(new TextPrompt('text'));
        this.addDialog(new NumberPrompt('number'));

        // Finally, add a 2-step WaterfallDialog that will initiate the SlotFillingDialog,
        // and then collect and display the results.
        this.addDialog(new WaterfallDialog('root', [
            this.chooseAction.bind(this),
            this.startDialog.bind(this),
            this.processResults.bind(this)
        ]));

        this.initialDialogId = 'root';
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} dialogContext
     */
    async run(context, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        
        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        console.log(results);
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async chooseAction(step) {

        // return await this.sendSuggestedActions(step);

        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'What would you like to do?',
            choices: ChoiceFactory.toChoices(['Buy a laptop', 'Plan a trip'])
        });
    }

    // This is the first step of the WaterfallDialog.
    // It kicks off the dialog with the multi-question SlotFillingDialog,
    // then passes the aggregated results on to the next step.
    async startDialog(step) {
        if (step.result.value.toLowerCase() == 'Buy a laptop'.toLowerCase()) {
            step.values.choice = step.result.value;
            return await step.beginDialog('laptop');
        }
        if(step.result.value.toLowerCase() == 'Plan a trip'.toLowerCase()) {
            step.values.choice = step.result.value;
            return await step.beginDialog('trip');
        }
    }

    // This is the second step of the WaterfallDialog.
    // It receives the results of the SlotFillingDialog and displays them.
    async processResults(step) {
        // Each "slot" in the SlotFillingDialog is represented by a field in step.result.values.
        // The complex that contain subfields have their own .values field containing the sub-values.
        const values = step.result.values;

        if (step.values.choice.toLowerCase() == 'Buy a laptop'.toLowerCase()) {

            laptopCard.body[0].columns[1].items[0].text = values.company;
            laptopCard.body[1].columns[1].items[0].text = values.colour;
            laptopCard.body[2].columns[1].items[0].text = values.purpose;
            laptopCard.body[3].columns[1].items[0].text = values.budget;
            await step.context.sendActivity({
                text: 'Here is your data for laptop:',
                attachments: [CardFactory.adaptiveCard(laptopCard)]
            });

            // let finalReply = `The company you want is ${ values.company }, `;
            // finalReply += `the colour of laptop you want is ${ values.colour }, `;
            // finalReply += `the purpose of your laptop is ${ values.purpose } and `;
            // finalReply += `your budget is ${ values.budget }`;
            // await step.context.sendActivity(finalReply);
        }
        else if(step.values.choice.toLowerCase() == 'Plan a trip'.toLowerCase()) {

            tripCard.body[0].columns[1].items[0].text = values.country;
            tripCard.body[1].columns[1].items[0].text = values.state;
            tripCard.body[2].columns[1].items[0].text = values.days;
            tripCard.body[3].columns[1].items[0].text = values.budget;
            await step.context.sendActivity({
                text: 'Here is your data for your trip:',
                attachments: [CardFactory.adaptiveCard(tripCard)]
            });

            // let finalReply = `The country you want to visit is ${ values.country }, `;
            // finalReply += `the state you want to visit is ${ values.state }, `;
            // finalReply += `your vacation is ${ values.days } long and `;
            // finalReply += `your budget for the vacation is ${ values.budget }`;
            // await step.context.sendActivity(finalReply);
        }


        return await step.endDialog();
    }

    async sendSuggestedActions(step) {
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

        let reply = MessageFactory.suggestedActions(cardActions, 'What would you like to do?');
        await step.context.sendActivity(reply);
    }
}

module.exports.RootDialog = RootDialog;
