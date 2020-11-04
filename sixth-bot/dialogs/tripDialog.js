// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { CardFactory } = require('botbuilder');
const {
    AttachmentPrompt,
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { Channels } = require('botbuilder-core');
const { Trip } = require('./trip');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const tripCard = require('../resources/TripCard.json');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
// const SPECIAL_NUMBER_PROMPT = 'SPECIAL_NUMBER_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class TripDialog extends CancelAndHelpDialog {
    constructor(dialogId, userState) {
        super(dialogId);

        this.trip = userState.createProperty(USER_PROFILE);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        // this.addDialog(new TextPrompt(SPECIAL_NUMBER_PROMPT, this.numberValidator));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.countryStep.bind(this),
            this.stateStep.bind(this),
            this.durationStep.bind(this),
            this.budgetStep.bind(this),
            this.summaryStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async countryStep(step) {
        return await step.prompt(NAME_PROMPT, 'Please enter the country you want to visit.');
    }

    async stateStep(step) {
        step.values.country = step.result;
        
        // if(step.result.toLowerCase() === 'quit' || step.result.toLowerCase() === 'exit') {
        //     return await step.endDialog();
        // }

        return await step.prompt(NAME_PROMPT, {
            prompt: 'Please enter the state you want to travel.'
        });
    }
    
    async durationStep(step) {
        step.values.state = step.result;
       
        // if(step.result.toLowerCase() === 'quit' || step.result.toLowerCase() === 'exit') {
        //     return await step.endDialog();
        // }

        const promptOptions = { prompt: 'Please enter the duration of vacation.', retryPrompt: 'Please enter a number.' };
        return await step.prompt(NUMBER_PROMPT, promptOptions);      

    }

    async budgetStep(step) {
        step.values.duration = step.result;
        
        // if(step.result.toLowerCase() === 'quit' || step.result.toLowerCase() === 'exit') {
        //     return await step.endDialog();
        // }

        return await step.prompt(NUMBER_PROMPT, {
            prompt: 'Please enter your budget.',
            retryPrompt: 'Please enter a number.'
        });
    }

    async summaryStep(step) {
        step.values.budget = step.result;

        // if(step.result.toLowerCase() === 'quit' || step.result.toLowerCase() === 'exit') {
        //     return await step.endDialog();
        // }

        // Get the current profile object from user state.
        const trip = await this.trip.get(step.context, new Trip());

        trip.country = step.values.country;
        trip.state = step.values.state;
        trip.duration = step.values.duration.toString();
        trip.budget = step.values.budget.toString();

        //Returning Adaptive card of user info
        tripCard.body[0].columns[1].items[0].text = trip.country;
        tripCard.body[1].columns[1].items[0].text = trip.state;
        tripCard.body[2].columns[1].items[0].text = trip.duration;
        tripCard.body[3].columns[1].items[0].text = trip.budget;
        await step.context.sendActivity({
            text: 'Here is your information:',
            attachments: [CardFactory.adaptiveCard(tripCard)]
        });
        
        ////returning user information as text
        // let msg = `Your country is ${ trip.country }`;
        // msg += `, you are ${trip.state}`;
        // msg += `, your date of birth is ${ trip.duration }`;
        // msg += ` and you are ${ trip.budget}`
        // msg += '.';
        // await step.context.sendActivity(msg);

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is the end.
        return await step.endDialog();
    }

    // async numberValidator(promptContext) {
    //     if (promptContext.recognized.succeeded) {
    //         const input = promptContext.recognized.value;
    //         return (Number.isInteger(parseInt(input)) || input.toLowerCase() == 'quit' || input.toLowerCase() == 'exit');
    //     }
    // }
}

module.exports.TripDialog = TripDialog;