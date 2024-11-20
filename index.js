const { Client, Events, GatewayIntentBits, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { token } = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
    console.log(`Logged in as ${c.user.tag}`);

    const ping = new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with "Here!"');

    const remind = new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Remind player to take their turn if they have an action to take.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to remind')
                .setRequired(false)
        );

    const openBot = new SlashCommandBuilder()
        .setName('open')
        .setDescription('Tell all users with role that bot is online.')
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('role you want to ping')
                .setRequired(true)

        );

    const roll = new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Dictate what dice to roll.')
        .addIntegerOption(option =>
            option
                .setName('number')
                .setDescription('Number of dice to roll')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('size')
                .setDescription('Size of dice to roll')
                .setRequired(true)
        );

    const createEvent = new SlashCommandBuilder()
        .setName('event')
        .setDescription('Create an event');

    const createEntity = new SlashCommandBuilder()
        .setName('entity')
        .setDescription('Create an entity in the world');

    const setPhase = new SlashCommandBuilder()
        .setName('setphase')
        .setDescription('Set the current phase of the game')
        .addStringOption(option =>
            option
                .setName('phase')
                .setDescription('Choose the phase that the game is currently in')
                .addChoices(
                    { name: 'The Age of Creation', value: 'The Age of Creation' },
                    { name: 'The Age of Mortals', value: 'The Age of Mortals' },
                )
        );

    const initiative = new SlashCommandBuilder()
        .setName('initiative')
        .setDescription('Roll for initiative')

    const clearinit = new SlashCommandBuilder()
        .setName('clearinit')
        .setDescription('Clear the initiative order for use again.')

    const raiseArmy = new SlashCommandBuilder()
        .setName('raisearmy')
        .setDescription('Target entity attempts to raise an army.')
        .addStringOption(option => 
            option
                .setName('entity')
                .setDescription('Entity that is raising the army.')
                .setRequired(true)
            );
    
    const disasterRoll = new SlashCommandBuilder()
        .setName('rolldisaster')
        .setDescription('Roll on the disaster table to see what disaster befalls the race.');

    const createSettlement = new SlashCommandBuilder()
        .setName('settlement')
        .setDescription('Create a settlement for your represented race.');

        client.application.commands.create(ping);
        client.application.commands.create(remind);
        client.application.commands.create(openBot);
        client.application.commands.create(roll);
        client.application.commands.create(setPhase);
        client.application.commands.create(initiative);
        client.application.commands.create(clearinit);
        client.application.commands.create(createEvent);
        client.application.commands.create(createEntity);
        client.application.commands.create(raiseArmy);
        client.application.commands.create(disasterRoll);
        client.application.commands.create(createSettlement);
});

let initiativeOrder = [];
const armysize = [100, 1000, 10000, 100000, 100000, 10000000];
const disasterOutcomes = ['Religious Fall', 'Resource Collapse', 'Internal War', 'Freakish Magic', 'Earthquake', 'Plague', 'Political Coup', 'Wildfire', 'Freak Storm', 'Unearthing a cursed artifact', 'Economic Collapse', 'Magical Rift', 'Famine', 'Cultural Erasure', 'Wandering Cataclysm (Mythical Creature)', 'Divine Wrath', 'Monster Uprising', 'Forgotten Curse', 'Unholy Ritual', 'Exodus'];


client.on(Events.InteractionCreate, async (interaction) => {
    console.log(`Interaction received: Type=${interaction.type}, Custom ID=${interaction.customId || 'N/A'}`);

    if (interaction.isChatInputCommand()){
        if (interaction.commandName === 'ping') {
            interaction.reply('Here!');
        }
    
        if (interaction.commandName === 'remind') {
            let user = interaction.options.getUser('user');
            if (!user) user = interaction.user;
            interaction.reply(`Greetings, ${user}. This is a reminder to take your action for the turn. If you don't know what action to take try the **/actions** command or go through the Braunstein* rules online.`);
        }
    
        if (interaction.commandName === 'open') {
            let chosenRole = interaction.options.getRole('role');
            interaction.reply(`Greetings ${chosenRole}'s, I am open and ready to take log of your turns.`)
        }
    
        if (interaction.commandName === 'roll') {
            const numberOfDice = interaction.options.getInteger('number');
            const diceSize = interaction.options.getInteger('size');
    
            // Roll the dice
            const results = [];
            for (let i = 0; i < numberOfDice; i++) {
                const roll = Math.floor(Math.random() * diceSize) + 1;
                results.push(roll);
            }
    
            // Calculate the total
            const total = results.reduce((sum, value) => sum + value, 0);
    
            // Format and send the reply
            interaction.reply(`🎲 ${interaction.user} rolled **${numberOfDice}d${diceSize}**.\nResults: ${results.join(', ')}\nTotal: **${total}**`);
        }
    
        if (interaction.commandName === 'setphase') {
            let choice = interaction.options.getString('phase');
            interaction.reply(`__**The Current Age:**__ ${choice}`);
        }
    
        if (interaction.commandName === 'initiative') {
            const roll = Math.floor(Math.random() * 20) + 1;
            const username = interaction.user;
    
            const existingEntry = initiativeOrder.find(entry => entry.username === username);
    
            if (existingEntry) {
                existingEntry.roll = roll;
            } else {
                initiativeOrder.push({ username, roll });
            }
    
            initiativeOrder.sort((a, b) => b.roll - a.roll);
    
            const turnOrder = initiativeOrder
                .map((entry, index) => `${index + 1}. **${entry.username}**: ${entry.roll}`)
                .join('\n');
    
            // Reply with the turn order
            const replyMessage = interaction.reply({
                content: ` **Turn Order** \n${turnOrder}`,
            });
        }
    
        if (interaction.commandName === 'clearinit') {
            initiativeOrder = []
            interaction.reply('Initiative Order cleared.')
        }
    
        if (interaction.commandName === 'event') {
            const eventModal = new ModalBuilder()
                .setCustomId('EventModal')
                .setTitle('Create an Event')
    
            const eventName = new TextInputBuilder()
                .setCustomId('eventName')
                .setLabel('Name of Event')
                .setStyle(TextInputStyle.Short);
    
            const eventDescription = new TextInputBuilder()
                .setCustomId('eventDesc')
                .setLabel('Enter description of event')
                .setStyle(TextInputStyle.Paragraph);
    
            //Action rows - 1 text input per row
            const firstActionRow = new ActionRowBuilder().addComponents(eventName);
            const secondActionRow = new ActionRowBuilder().addComponents(eventDescription);
    
            eventModal.addComponents(firstActionRow, secondActionRow);
    
            
            console.log('Displaying modal for /event command');
            await interaction.showModal(eventModal);
        } 

        if(interaction.commandName === 'entity'){
            const entityModal = new ModalBuilder()
                .setCustomId('EntityModal')
                .setTitle('Create an Entity')
    
            const entityName = new TextInputBuilder()
                .setCustomId('entityName')
                .setLabel('Name of Entity')
                .setStyle(TextInputStyle.Short);

            const entityType = new TextInputBuilder()
                .setCustomId('entityType')
                .setLabel('Type of Entity')
                .setStyle(TextInputStyle.Short);
    
            const entityDescription = new TextInputBuilder()
                .setCustomId('entityDesc')
                .setLabel('Enter description of entity')
                .setStyle(TextInputStyle.Paragraph);
    
            //Action rows - 1 text input per row
            const firstActionRow = new ActionRowBuilder().addComponents(entityName);
            const secondActionRow = new ActionRowBuilder().addComponents(entityType)
            const thirdActionRow = new ActionRowBuilder().addComponents(entityDescription);
    
            entityModal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
    
            
            console.log('Displaying modal for /entity command');
            await interaction.showModal(entityModal); 
        }

        if(interaction.commandName === 'raisearmy'){
            const entityName = interaction.options.getString('entity');

            const roll = Math.floor(Math.random() * 6);
            currentArmySize = armysize[roll];

            const numberRoll = Math.floor(Math.random() * 100) + 1;
            raisedArmySize = currentArmySize * numberRoll;

            interaction.reply(`**${interaction.user} used Raise an Army action.** \n\n __${entityName} raised an army.__ \n\n Rolled: ${roll} which is equivalent to ${currentArmySize} units \n The D100 roll: ${numberRoll} \n __Total Army Size:__ ${raisedArmySize}`);
        }

        if(interaction.commandName === 'rolldisaster'){
            const roll = Math.floor(Math.random() * 20);
            const currentDisaster = disasterOutcomes[roll];

            interaction.reply(`${interaction.user} rolled on the Disaster Table. \nThe disaster that befalls your people: __**${currentDisaster}**__`);
        }

        if(interaction.commandName === 'settlement'){
            const settlementModal = new ModalBuilder()
                .setCustomId('SettlementModal')
                .setTitle('Create an Settlement')
    
            const settlementName = new TextInputBuilder()
                .setCustomId('settlementName')
                .setLabel('Name of Settlement')
                .setStyle(TextInputStyle.Short);

            const settlementType = new TextInputBuilder()
                .setCustomId('settlementType')
                .setLabel('Size of Settlement')
                .setStyle(TextInputStyle.Short);

            const settlementLocation = new TextInputBuilder()
                .setCustomId('settlementLocation')
                .setLabel('Settlement Location [Code on Hex Map]')
                .setStyle(TextInputStyle.Short);
    
            const settlementDescription = new TextInputBuilder()
                .setCustomId('settlementDesc')
                .setLabel('Enter description of settlement')
                .setStyle(TextInputStyle.Paragraph);
    
            //Action rows - 1 text input per row
            const firstActionRow = new ActionRowBuilder().addComponents(settlementName);
            const secondActionRow = new ActionRowBuilder().addComponents(settlementType)
            const thirdActionRow = new ActionRowBuilder().addComponents(settlementDescription);
            const fourthActionRow = new ActionRowBuilder().addComponents(settlementLocation)
    
            settlementModal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
    
            
            console.log('Displaying modal for /settlement command');
            await interaction.showModal(settlementModal); 
        }
    }else if (interaction.isModalSubmit()) {
        //Modal submission
        if (interaction.customId === 'EventModal') {
            console.log('Modal submitted:', interaction.customId);
            try {
                const eventName = interaction.fields.getTextInputValue('eventName');
                const eventDescription = interaction.fields.getTextInputValue('eventDesc');
                const username = interaction.user;
                const disasterCheck = Math.floor(Math.random() * 6) + 1;
                if (disasterCheck == 1) {
                    disasterResponse = "Disaster [Roll on the Disaster Table]"
                } else {
                    disasterResponse = "No Disaster"
                }
    
                await interaction.reply({
                    content: `${username} created an Event \n\n **Event Name:** ${eventName}\n **Event Description:** ${eventDescription} \n\n Disaster Check: ${disasterCheck} (${disasterResponse})`
                });
            } catch (error) {
                console.error('Failed to handle modal submission:', error);
                await interaction.reply({
                    content: 'An error occurred while processing your submission.',
                    ephemeral: true,
                });
            }
        } else if(interaction.customId === 'EntityModal'){
            console.log('Modal submitted:', interaction.customId);
            try {
                const entityName = interaction.fields.getTextInputValue('entityName');
                const entityType = interaction.fields.getTextInputValue('entityType');
                const entityDescription = interaction.fields.getTextInputValue('entityDesc');
                const username = interaction.user;

                await interaction.reply({
                    content: `${username} created an Entity \n\n **Entity Name:** ${entityName}\n **Entity Type:** ${entityType} \n\n **Entity Description:** ${entityDescription}`
                })
            } catch(error) {
                console.error('Failed to handle modal submission:', error);
                await interaction.reply({
                    content: 'An error occurred while processing your submission.',
                    ephemeral: true,
                });
            }
        } else if(interaction.customId === 'SettlementModal') {
            console.log('Modal Submitted: ', interaction.customId);
            try {
                const settlementName = interaction.fields.getTextInputValue('settlementName');
                const settlementType = interaction.fields.getTextInputValue('settlementType');
                const settlementDesc = interaction.fields.getTextInputValue('settlementDesc');
                const settlementLocation = interaction.fields.getTextInputValue('settlementLocation');
                const username = interaction.user;

                await interaction.reply({
                    content: `${username} created a Settlment \n\n **Settlment Name:** ${settlementName}\n **Settlment Type:** ${settlementType} \n\n **Settlment Description:** ${settlementDesc} \n\n **Located at Hex:** ${settlementLocation}`
                })
            } catch (error) {
                console.error('Failed to handle modal submission:', error);
                await interaction.reply({
                    content: 'An error occurred while processing your submission.',
                    ephemeral: true,
                });
            }

        } else {
            console.log('Modal submission with unrecognized customId:', interaction.customId);
        }
    }


});

client.login(token);



