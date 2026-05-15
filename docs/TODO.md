### TODO

[x] Los prefijos pueden ser una lista especifiaca al menos una cantidad especifica.
[x] Implement, import and export macros. What is the most standard format.
[x] fuzzy find
[x] autocompletion list with tab
[x] convert the popup in a side panel
    I tried the side panel but it was not the intended UX
    I implemented a modal overlay that currently search for the macros with fuzzy find.
[x] edit the readme
[x] Fix: manual committing with space is not working after the backspace functionality.
[x] Fix: the popup scrollbar is not themed.
[x] Fix; the popup dark theme is different than the search overlay, color consistencies and common color palette is required.
[x] The new macro button in the popup is missing.
[x] Unify all the interface popup and editor into the overlay modal currently used only to search. So they are going to be new views accessible by two buttons: create/edit macros and options.
[x] In the search modal it should be little label indicating the current number of macros in the results.
[x] The undo should be able to delete an immediately replaced macro. That should be the undo behavior after a macro commit.
[x] Fix: I found an issue in while working with the tests: the space is not triggering a macro if there is another macro that starts with the same prefix.
[x] Fix: The undo test are currently made to be used with commit keys but currently the detector is working in auto mode.
[?] Fix: in auto mode the undo does not get cleared and repeats the command after the previous undo.
[x] Search overlay is not restoring focus not managing undo.
[x] When the user adds content to the buffer and the macro suggestions is displaying, it should be useful that the macro suggestions should update its content accordingly, fine grining the suggestions.
[x] The macro text content sometimes is long and it will make the macro suggestions grow to an unconftable size, we need to trim the content as well up to certain characters.
[x] Fix:The macro suggestions is missing the styles
[x] Fix:The macro suggestions should trim long macros in the preview area to fit into the one line of the popup.
[x] The macro suggestions row of buttons are trimming short command and long command indistinctly, it should prioritize trimming the longest ones, providing space to read the short standard ones. Please note that this trimming is accounting for edge cases. The macros tend to be short mostly.
[x] Fix:The search overlay is no longer a search overlay it has now integrated three tabs the search, the editor,and the settings. (should the name of the overlay change in the code? Something like main overlay) Now it needs to be able to navigate among tabs with the left and right arrow keys.
[ ] Fix:The icon is not visible in the toolbar in dark mode.
[x] Fix:the main overlay does not have the icon or banding
[x] Fix:In the search tab it may be reflected the number of matching macros.
[x] Fix:The editor interface feels wrong the lists of macros there to edit is difficult to navigate, currently it does not have scrollbar, not the option to create a new macro.Maybe pressing plus on the search marco for a new macro and tab for edit the current selected macro will remove the list from the macro editor. (This has been changed: the :new and :edit commands lauches the editor)
define what is going to be in the macro menu on the extension icon. Maybe the help.
[ ] Fine tune the UX. images controls ex: the enable and disable interface element.
[ ] The save new macro button is not closing the overlay.(Should it show display the created macro as confirmation or close, currently is just clearing out the editor's fields)
[ ] in auto mode :edit/some-command and :delete/some-command currently are needing the confirmation char space or enter to trigger, but the current behavior for macros in auto mode is that it gets triggered as soon as a complete match is made or with a delay if it is a match but there is another longer macro with the same match. This should be the same behavior for this system parametric commands. When fix it please confirm that the current implementation is used to avoid reimplementing it for this case. :new in the other hand is working as expected.
[ ] Create macros is allowig duplicate commands
[ ] :new and :edit on the text field, needs to move the focus to the fisrt field on the editor form
[ ] Cancel ont the editor is not closing the overlay.
[ ] The /? has been registered in the app as a special command to launch the search panel. Now that we are using the : prefix for system commands, the /? command needs to change to :? all the implementation for handling the /? exception needs to be revised and or removed as it no longer is required, and instead just implement it as an additional system macro in the line of :edit :delete and :new
[ ] In the editor when entering a edit the placeholder tex is being displayed ont top of the actual text
[ ] The editor update button is sending the user to the search panel, What would be the desired behaiviour.
[x] Clean up legacy code files adn documents
[ ] Change the small texts secctions to a cleannest UI typeface.
[ ] Utilize a standard dimension among views in the modal so it does not get resized when switching.
[ ] The editor interface is not well rounded, feels unatural.
[ ] Ctl v is not working in the editor field nor the html buttons.
[?] when the search has been refined to few macros, if some have multines the can display more lines of the macro. This is tricky it shold intent to have the list on the viewable area, so basicly it has to spread the availabe space among the ones that require more vertical space.
[x] Fix the translations on the interface.
[ ] :new macro commant used in the user's text field or in the search view is not moving the focus to the editor's view first field.
[ ] When the selection is reined the first macro is expaniding the visible area to the available space instead to the necesary space to display the macro text content.
[ ] Implement the macro engine for google docs.
[ ] The editor remains showing the placeholder text and the actual content at the same time.
[ ] The editor does no support Crl v.
[ ] The editor is growing down outside the interface area instead of showing a scrollbar.
[ ] Add an option to show/hide the suggestions keyboard shorcuts at the botton of the suggestons overlay.
[ ] Fix the suggestions overlay height to match with the text rows.
[ ] Add a scrolling feature for the selected macro text content using key up and down.
[ ] Possible feature: add an option to select the suggestions overlay height.
[ ] Theme changes -- new theme color selection feature.
[ ] Possible theme layout options too.



### Suggestions

[x] Macro Suggestions is not bringing the focus back and placing the caret after the replacement.
[x] It should start by triggering tab key for example
[x] It should be sowing results based on fuzzy find
[ ] It may be showing only one line of the macro text
[ ] The navigation help at the bottom should be showing only when the ? key is pressed or by adding a ? button at the end of the macro suggestions, and therefore showing the content of the navigation instructions in the same place that the suggestions text appears for the other suggestions buttons.
[ ] Fix: The window bottom space is not being calculated properly, or is not moving the popup accordingly.
[x] Fix: The suggestions buttons are not triggering the replacement when clicked.
[x] Fix: After the suggestions replacement the undo is not working.


### Search

[X] Fix: The search is no bringing the focus back.




