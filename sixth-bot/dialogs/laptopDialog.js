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
const { Laptop } = require('./laptop');

const laptopCard = require('../resources/LaptopCard.json');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class LaptopDialog extends ComponentDialog {
    constructor(dialogId, userState) {
        super(dialogId);

        this.laptop = userState.createProperty(USER_PROFILE);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.companyStep.bind(this),
            this.colourStep.bind(this),
            this.purposeStep.bind(this),
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

    async companyStep(step) {
        return await step.prompt(NAME_PROMPT, 'Please enter the name of the company');
    }

    async colourStep(step) {
        step.values.company = step.result;

        return await step.prompt(NAME_PROMPT, {
            prompt: 'Please enter the colour you want.'
        });
    }
    
    async purposeStep(step) {
        step.values.colour = step.result;
       
        const promptOptions = { prompt: 'Please enter the your purpose of laptop.'};
        return await step.prompt(NAME_PROMPT, promptOptions);      

    }

    async budgetStep(step) {
        step.values.purpose = step.result;

        return await step.prompt(NUMBER_PROMPT, {
            prompt: 'Please enter your budget.'
        });
    }

    async summaryStep(step) {
        step.values.budget = step.result;

        // Get the current profile object from user state.
        const laptop = await this.laptop.get(step.context, new Laptop());

        laptop.company = step.values.company;
        laptop.colour = step.values.colour;
        laptop.purpose = step.values.purpose;
        laptop.budget = step.values.budget.toString();

        //Returning Adaptive card of user info
        laptopCard.body[0].columns[1].items[0].text = laptop.company;
        laptopCard.body[1].columns[1].items[0].text = laptop.colour;
        laptopCard.body[2].columns[1].items[0].text = laptop.purpose;
        laptopCard.body[3].columns[1].items[0].text = laptop.budget;
        await step.context.sendActivity({
            text: 'Here is your information:',
            attachments: [CardFactory.adaptiveCard(laptopCard)]
        });
        
        ////returning user information as text
        // let msg = `Your company is ${ laptop.company }`;
        // msg += `, you are ${laptop.colour}`;
        // msg += `, your date of birth is ${ laptop.purpose }`;
        // msg += ` and you are ${ laptop.budget}`
        // msg += '.';
        // await step.context.sendActivity(msg);

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is the end.
        return await step.endDialog();
    }
}

module.exports.LaptopDialog = LaptopDialog;