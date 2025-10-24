### TODO

[x] Los prefijos pueden ser una lista especifiaca al menos una cantidad especifica.
[ ] Exportar e importar macros. ver si existe algun formato estandard.
[ ] Trabajar la experiencia de usario. imagen controles
    por ej la seleccion de habilitar y deshabilitar.
[x] fuzzy find
[ ] autocompletion list with tab
[x] convert the popup in a side panel
    I tried the side panel but it was not the intended UX
    I implemented a modal overlay that currently search for the macros with fuzzy find.
[x] edit the readme
[ ] Feature: space should wait a bit for committing if backspace is typed then the backspace functionality takes place but if another key is typed the the replacement should be performed and the key appended.
[ ] Fix: manual committing with space is not working after the backspace functionality.
[x] Fix: the popup scrollbar is not themed.
[x] Fix; the popup dark theme is different than the search overlay, color consistencies and common color palette is required.
[x] The new macro button in the popup is missing.
[ ] Unify all the interface popup and editor into the overlay modal currently used only to search. So they are going to be new views accessible by two buttons: create/edit macros and options.
[ ] In the search modal it should be little label indicating the current number of macros in the results.


### NMS

[x] NMS is not bringing the focus back and placing the caret after the replacement.
[ ] It should start by triggering tab key for example
[ ] It should be sowing results based on fuzzy find
[ ] It may be showing only one line of the macro text
[ ] the navigation help at the bottom should be showing only when the ? key is pressed or by adding a ? button at the end of the macro suggestions, and therefore showing the content of the navigation instructions in the same place that the suggestions text appears for the other suggestions buttons.
[ ] window bottom space is not working properly.