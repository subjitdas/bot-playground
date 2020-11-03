// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { MessageFactory } = require('botbuilder');
const { ActionTypes } = require('botframework-schema');

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

const { LaptopDialog } = require('./laptopDialog');
const { TripDialog } = require('./tripDialog');

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

        // Add the individual child dialogs and prompts used.
        // Note that the built-in prompts work hand-in-hand with our custom SlotFillingDialog class
        // because they are both based on the provided Dialog class.
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new LaptopDialog('laptop', userState));
        this.addDialog(new TripDialog('trip', userState));
        this.addDialog(new TextPrompt('text'));
        this.addDialog(new NumberPrompt('number'));

        // Finally, add a 2-step WaterfallDialog that will initiate the SlotFillingDialog,
        // and then collect and display the results.
        this.addDialog(new WaterfallDialog('root', [
            this.chooseAction.bind(this),
            this.startDialog.bind(this)
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
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async chooseAction(step) {

        const message = await this.sendSuggestedActions();
        await step.context.sendActivity(message);
        return ComponentDialog.EndOfTurn;

        // return await step.prompt(CHOICE_PROMPT, {
        //     prompt: 'What would you like to do?',
        //     choices: ChoiceFactory.toChoices(['Buy a laptop', 'Plan a trip'])
        // });
    }

    // This is the first step of the WaterfallDialog.
    // It kicks off the dialog with the multi-question SlotFillingDialog,
    // then passes the aggregated results on to the next step.
    async startDialog(step) {
        const text = step.context.activity.text;
        if(text.toLowerCase() === 'quit' || text.toLowerCase() === 'exit') {
            return await step.endDialog();
        }
        if (text.toLowerCase() === 'Buy a laptop'.toLowerCase()) {
            step.values.choice = text;
            return await step.beginDialog('laptop');
        }
        if(text.toLowerCase() === 'Plan a trip'.toLowerCase()) {
            step.values.choice = text;
            return await step.beginDialog('trip');
        }
    }

    async sendSuggestedActions() {
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
        return reply;
    }
}

module.exports.RootDialog = RootDialog;
