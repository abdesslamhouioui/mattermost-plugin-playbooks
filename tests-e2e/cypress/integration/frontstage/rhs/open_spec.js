// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// ***************************************************************
// - [#] indicates a test step (e.g. # Go to a page)
// - [*] indicates an assertion (e.g. * Check the title)
// ***************************************************************

import * as TIMEOUTS from '../../../fixtures/timeouts';
import users from '../../../fixtures/users.json';

describe('playbook run rhs', () => {
    let testTeam;
    let testUser;
    let testPlaybook;

    before(() => {
        cy.apiInitSetup().then(({team, user}) => {
            testTeam = team;
            testUser = user;

            // # Turn off growth onboarding screens
            cy.apiUpdateConfig({
                ServiceSettings: {EnableOnboardingFlow: false},
            });

            // # Login as testUser
            cy.apiLogin(testUser);

            // # Create a public playbook
            cy.apiCreatePlaybook({
                teamId: testTeam.id,
                title: 'Playbook',
                memberIDs: [],
            }).then((playbook) => {
                testPlaybook = playbook;
            });
        });
    });

    beforeEach(() => {
        // # Login as testUser
        cy.apiLogin(testUser);
    });

    describe('does not open', () => {
        it('when navigating to a non-playbook run channel', () => {
            // # Navigate to the application
            cy.visit(`/${testTeam.name}/`);

            // # Select a channel without a playbook run.
            cy.get('#sidebarItem_off-topic').click({force: true});

            // # Wait until the channel loads enough to show the post textbox.
            cy.get('#post-create').should('exist');

            // # Wait a bit longer to be confident.
            cy.wait(TIMEOUTS.TWO_SEC);

            // * Verify the playbook run RHS is not open.
            cy.get('#rhsContainer').should('not.exist');
        });

        it('when navigating to a playbook run channel with the RHS already open', () => {
            // # Navigate to the application.
            cy.visit(`/${testTeam.name}/`);

            // # Select a channel without a playbook run.
            cy.get('#sidebarItem_off-topic').click({force: true});

            // # Run the playbook after loading the application
            const now = Date.now();
            const playbookRunName = 'Playbook Run (' + now + ')';
            const playbookRunChannelName = 'playbook-run-' + now;
            cy.apiRunPlaybook({
                teamId: testTeam.id,
                playbookId: testPlaybook.id,
                playbookRunName,
                ownerUserId: testUser.id,
            });

            // # Open the flagged posts RHS
            cy.get('#channelHeaderFlagButton').click({force: true});

            // # Open the playbook run channel from the LHS.
            cy.get(`#sidebarItem_${playbookRunChannelName}`).click({force: true});

            // # Wait until the channel loads enough to show the post textbox.
            cy.get('#post-create').should('exist');

            // # Wait a bit longer to be confident.
            cy.wait(TIMEOUTS.TWO_SEC);

            // * Verify the playbook run RHS is not open.
            cy.get('#rhsContainer').should('not.exist');
        });

        it('when navigating directly to a finished playbook run channel', () => {
            // # Run the playbook
            const now = Date.now();
            const playbookRunName = 'Playbook Run (' + now + ')';
            const playbookRunChannelName = 'playbook-run-' + now;
            cy.apiRunPlaybook({
                teamId: testTeam.id,
                playbookId: testPlaybook.id,
                playbookRunName,
                ownerUserId: testUser.id,
            }).then((playbookRun) => {
                // # End the playbook run
                cy.apiFinishRun(playbookRun.id);
            });

            // # Navigate directly to the application and the playbook run channel
            cy.visit(`/${testTeam.name}/channels/${playbookRunChannelName}`);

            // # Wait a bit longer to be confident.
            cy.wait(TIMEOUTS.TWO_SEC);

            // * Verify the playbook run RHS is not open.
            cy.get('#rhsContainer').should('not.exist');
        });

        it('for an existing, finished playbook run channel opened from the lhs', () => {
            // # Run the playbook before loading the application
            const now = Date.now();
            const playbookRunName = 'Playbook Run (' + now + ')';
            const playbookRunChannelName = 'playbook-run-' + now;

            cy.apiRunPlaybook({
                teamId: testTeam.id,
                playbookId: testPlaybook.id,
                playbookRunName,
                ownerUserId: testUser.id,
            }).then((playbookRun) => {
                // # End the playbook run
                cy.apiFinishRun(playbookRun.id);
            });

            // # Navigate to a channel without a playbook run.
            cy.visit(`/${testTeam.name}/channels/off-topic`);

            // # Ensure the channel is loaded before continuing (allows redux to sync).
            cy.get('#centerChannelFooter').findByTestId('post_textbox').should('exist');

            // # Open the playbook run channel from the LHS.
            cy.get(`#sidebarItem_${playbookRunChannelName}`).click({force: true});

            // # Wait a bit longer to be confident.
            cy.wait(TIMEOUTS.TWO_SEC);

            // * Verify the playbook run RHS is not open.
            cy.get('#rhsContainer').should('not.exist');
        });

        it('for a new, finished playbook run channel opened from the lhs', () => {
            // # Navigate to the application.
            cy.visit(`/${testTeam.name}/`);

            // # Ensure the channel is loaded before continuing (allows redux to sync).
            cy.get('#centerChannelFooter').findByTestId('post_textbox').should('exist');

            // # Select a channel without a playbook run.
            cy.get('#sidebarItem_off-topic').click({force: true});

            // # Run the playbook after loading the application
            const now = Date.now();
            const playbookRunName = 'Playbook Run (' + now + ')';
            const playbookRunChannelName = 'playbook-run-' + now;
            cy.apiRunPlaybook({
                teamId: testTeam.id,
                playbookId: testPlaybook.id,
                playbookRunName,
                ownerUserId: testUser.id,
            }).then((playbookRun) => {
                // # Wait a bit longer to avoid websocket events potentially being out-of-order.
                cy.wait(TIMEOUTS.TWO_SEC);

                // # End the playbook run
                cy.apiFinishRun(playbookRun.id);
            });

            // # Open the playbook run channel from the LHS.
            cy.get(`#sidebarItem_${playbookRunChannelName}`).click({force: true});

            // # Wait a bit longer to be confident.
            cy.wait(TIMEOUTS.TWO_SEC);

            // * Verify the playbook run RHS is not open.
            cy.get('#rhsContainer').should('not.exist');
        });
    });

    describe('opens', () => {
        it('when navigating directly to an ongoing playbook run channel', () => {
            // # Run the playbook
            const now = Date.now();
            const playbookRunName = 'Playbook Run (' + now + ')';
            const playbookRunChannelName = 'playbook-run-' + now;
            cy.apiRunPlaybook({
                teamId: testTeam.id,
                playbookId: testPlaybook.id,
                playbookRunName,
                ownerUserId: testUser.id,
            });

            // # Navigate directly to the application and the playbook run channel
            cy.visit(`/${testTeam.name}/channels/${playbookRunChannelName}`);

            // * Verify the playbook run RHS is open.
            cy.get('#rhsContainer').should('exist').within(() => {
                cy.findByText(playbookRunName).should('exist');
            });
        });

        it('for a new, ongoing playbook run channel opened from the lhs', () => {
            // # Navigate to the application.
            cy.visit(`/${testTeam.name}/`);

            // # Ensure the channel is loaded before continuing (allows redux to sync).
            cy.get('#centerChannelFooter').findByTestId('post_textbox').should('exist');

            // # Select a channel without a playbook run.
            cy.get('#sidebarItem_off-topic').click({force: true});

            // # Run the playbook after loading the application
            const now = Date.now();
            const playbookRunName = 'Playbook Run (' + now + ')';
            const playbookRunChannelName = 'playbook-run-' + now;
            cy.apiRunPlaybook({
                teamId: testTeam.id,
                playbookId: testPlaybook.id,
                playbookRunName,
                ownerUserId: testUser.id,
            });

            // # Open the playbook run channel from the LHS.
            cy.get(`#sidebarItem_${playbookRunChannelName}`).click({force: true});

            // * Verify the playbook run RHS is open.
            cy.get('#rhsContainer').should('exist').within(() => {
                cy.findByText(playbookRunName).should('exist');
            });
        });

        it('for an existing, ongoing playbook run channel opened from the lhs', () => {
            // # Run the playbook before loading the application
            const now = Date.now();
            const playbookRunName = 'Playbook Run (' + now + ')';
            const playbookRunChannelName = 'playbook-run-' + now;
            cy.apiRunPlaybook({
                teamId: testTeam.id,
                playbookId: testPlaybook.id,
                playbookRunName,
                ownerUserId: testUser.id,
            });

            // # Navigate to a channel without a playbook run.
            cy.visit(`/${testTeam.name}/channels/off-topic`);

            // # Ensure the channel is loaded before continuing (allows redux to sync).
            cy.get('#centerChannelFooter').findByTestId('post_textbox').should('exist');

            // # Open the playbook run channel from the LHS.
            cy.get(`#sidebarItem_${playbookRunChannelName}`).click({force: true});

            // * Verify the playbook run RHS is open.
            cy.get('#rhsContainer').should('exist').within(() => {
                cy.findByText(playbookRunName).should('exist');
            });
        });

        it('when starting a playbook run', () => {
            // # Navigate to the application and a channel without a playbook run
            cy.visit(`/${testTeam.name}/channels/off-topic`);

            // # Start a playbook run with a slash command
            const now = Date.now();
            const playbookRunName = 'Playbook Run (' + now + ')';

            cy.startPlaybookRunWithSlashCommand("Playbook", playbookRunName);

            // * Verify the playbook run RHS is open.
            cy.get('#rhsContainer').should('exist').within(() => {
                cy.findByText(playbookRunName).should('exist');
            });
        });
    });

    describe('is toggled', () => {
        it('by icon in channel header', () => {
            // # Size the viewport to show plugin icons even when RHS is open
            cy.viewport('macbook-13');

            // # Navigate to the application and a channel without a playbook run
            cy.visit(`/${testTeam.name}/channels/off-topic`);

            // # Click the icon
            cy.get('#channel-header').within(() => {
                cy.get('#incidentIcon').should('exist').click({force: true});
            });

            // * Verify RHS Home is open.
            cy.get('#rhsContainer').should('exist').within(() => {
                cy.findByText('Playbooks').should('exist');
            });

            // # Click the icon again
            cy.get('#channel-header').within(() => {
                cy.get('#incidentIcon').should('exist').click({force: true});
            });

            // * Verify the playbook run RHS is no longer open.
            cy.get('#rhsContainer').should('not.exist');
        });
    });
});
