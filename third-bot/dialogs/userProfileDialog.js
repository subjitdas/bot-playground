// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const dateValidator = require("DateValidator").DateValidator;

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
const { UserProfile } = require('../userProfile');

const userInfoCard = require('../resources/UserInfoCard.json');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class UserProfileDialog extends ComponentDialog {
    constructor(userState) {
        super('userProfileDialog');

        this.userProfile = userState.createProperty(USER_PROFILE);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new TextPrompt(NUMBER_PROMPT, this.dobPromptValidator));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.genderStep.bind(this),
            this.dobStep.bind(this),
            this.maritalStatusStep.bind(this),
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

    async nameStep(step) {
        return await step.prompt(NAME_PROMPT, 'Please enter your name.');
    }

    async genderStep(step) {
        step.values.name = step.result;
        await step.context.sendActivity(`Thanks ${ step.result }.`);
        // We can send messages to the user at any point in the WaterfallStep.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please choose your gender.',
            choices: ChoiceFactory.toChoices(['Male', 'Female', 'Others'])
        });
    }
    
    async dobStep(step) {
        step.values.gender = step.result.value;
       
        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        const promptOptions = { prompt: 'Please enter your date of birth.', retryPrompt: 'Enter a valid date in YYYY/MM/DD format only.' };
        return await step.prompt(NUMBER_PROMPT, promptOptions);      

    }

    async maritalStatusStep(step) {
        step.values.dob = step.result;
        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please choose your marital status.',
            choices: ChoiceFactory.toChoices(['Married', 'Unmarried'])
        });
    }

    async summaryStep(step) {
        step.values.maritalStatus = step.result.value;

        // Get the current profile object from user state.
        const userProfile = await this.userProfile.get(step.context, new UserProfile());

        userProfile.name = step.values.name;
        userProfile.gender = step.values.gender;
        userProfile.dob = step.values.dob;
        userProfile.maritalStatus = step.values.maritalStatus;

        //Returning Adaptive card of user info
        userInfoCard.body[0].columns[1].items[0].text = userProfile.name;
        userInfoCard.body[1].columns[1].items[0].text = userProfile.gender;
        userInfoCard.body[2].columns[1].items[0].text = userProfile.dob;
        userInfoCard.body[3].columns[1].items[0].text = userProfile.maritalStatus;
        await step.context.sendActivity({
            text: 'Here is your information:',
            attachments: [CardFactory.adaptiveCard(userInfoCard)]
        });
        
        ////returning user information as text
        // let msg = `Your name is ${ userProfile.name }`;
        // msg += `, you are ${userProfile.gender}`;
        // msg += `, your date of birth is ${ userProfile.dob }`;
        // msg += ` and you are ${ userProfile.maritalStatus}`
        // msg += '.';
        // await step.context.sendActivity(msg);

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is the end.
        return await step.endDialog();
    }

    async dobPromptValidator(promptContext) {
        // This condition is our validation rule. You can also change the value at this point.
        if(promptContext.recognized.succeeded) {
            let date = promptContext.recognized.value.split("/");
            if(date[0].toString().length == 4) {
                return dateValidator.validate(date[0], date[1], date[2]);
            }
        }
        return false;
    }
}

module.exports.UserProfileDialog = UserProfileDialog;