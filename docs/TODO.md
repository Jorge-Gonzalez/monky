### TODO

[x] Los prefijos pueden ser una lista especifiaca al menos una cantidad especifica.
[ ] Exportar e importar macros. ver si existe algun formato estandard.
[ ] Trabajar la experiencia de usario. imagen controles
    por ej la seleccion de habilitar y deshabilitar.
[x] fuzzy find
[x] autocompletion list with tab
[x] convert the popup in a side panel
    I tried the side panel but it was not the intended UX
    I implemented a modal overlay that currently search for the macros with fuzzy find.
[x] edit the readme
[ ] ? Feature: space should wait a bit for committing if backspace is typed then the backspace functionality takes place but if another key is typed the the replacement should be performed and the key appended.
[ ] Fix: manual committing with space is not working after the backspace functionality.
[x] Fix: the popup scrollbar is not themed.
[x] Fix; the popup dark theme is different than the search overlay, color consistencies and common color palette is required.
[x] The new macro button in the popup is missing.
[ ] Unify all the interface popup and editor into the overlay modal currently used only to search. So they are going to be new views accessible by two buttons: create/edit macros and options.
[ ] In the search modal it should be little label indicating the current number of macros in the results.
[x] The undo should be able to delete an immediately replaced macro. That should be the undo behavior after a macro commit.
[ ] Fix: I found an issue in while working with the tests: the space is not triggering a macro if there is another macro that starts with the same prefix.
[x] Fix: The undo test are currently made to be used with commit keys but currently the detector is working in auto mode.
[?] Fix: in auto mode the undo does not get cleared and repeats the command after the previous undo.
[x] Search overlay is not restoring focus not managing undo.



### Suggestions

[x] Macro Suggestions is not bringing the focus back and placing the caret after the replacement.
[x] It should start by triggering tab key for example
[x] It should be sowing results based on fuzzy find
[ ] It may be showing only one line of the macro text
[ ] The navigation help at the bottom should be showing only when the ? key is pressed or by adding a ? button at the end of the macro suggestions, and therefore showing the content of the navigation instructions in the same place that the suggestions text appears for the other suggestions buttons.
[ ] Fix: The window bottom space is not being calculated properly, or is not moving the popup accordingly.
[ ] Fix: The suggestions buttons are not triggering the replacement when clicked.
[ ] Fix: After the suggestions replacement the undo is not working.
[ ] Fix: Replacement is not happening when manual mode is on.


### Search

[ ] Fix: The search is no bringing the focus back.

