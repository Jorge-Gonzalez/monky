### TODO

[x] Los prefijos pueden ser una lista especifiaca al menos una cantidad especifica.
[ ] Implement, import and export macros. What is the most standard format.
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
[ ] In the search modal it should be little label indicating the current number of macros in the results.
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
[ ] Fix:the main overlay does not have the icon or banding
[ ] Fix:In the search tab it may be reflected the number of matching macros.
[ ] Fix:The editor interface feels wrong the lists of macros there to edit is difficult to navigate, currently it does not have scrollbar, not the option to create a new macro.Maybe pressing plus on the search marco for a new macro and tab for edit the current selected macro will remove the list from the macro editor.
define what is going to be in the macro menu on the extension icon. Maybe the help.
[ ] Fine tune the UX. images controls ex: the enable and disable interface element.



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




