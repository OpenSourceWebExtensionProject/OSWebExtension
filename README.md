# OSWebExtension
This repository consist of three web extension design for Firefox 


Web Extension one: Dictionary and Word of the Day.
-------------------------------------------------------------------------------------------------------------
First sub-task:
#01/10/2018 - Ju Kheng

Firefox Extension refer:
1. Axon-multilingual-dictionary 
Link: https://addons.mozilla.org/en-US/firefox/addon/neuron-multilingual-dictionary/ 
  
2. Word of the Day 
Link: https://chrome.google.com/webstore/detail/word-of-the-day/kloedcdpipobfmidkoafhmmmlpfjjehl 

Have to do:
1. Content > Popover > popover.html (Nicer layout)
2. Change extension icon and name

------------------------------------------------------------------------------------------------------------
Enhancement #1:
#04/10/2018 - Shu Xuan 
Updated codes to Word Of The Day function

-----------------------------------------------------------------------------------------------------------

Enhancement #2: 
#04/10/2018 - Freda
Have done: 
1. Update manifest.json file 
1a. Update Version 
1b. Update Description 
1c. Update application id
1d. Update Extension Name

2. icon changed
3. Beautify the  layout 

-----------------------------------------------------------------------------------------------------------
Debug #1:

#05/10/2018 - Shu Xuan 
Changed Secondary Language Code to Chinese

-----------------------------------------------------------------------------------------------------------
Code + Comments 

#17/10/2018 - Freda
In Progress of adding comments as guidelines in the extension files. 

Pending: Documentation for second extension: Dictionary and Word of the Day.

-----------------------------------------------------------------------------------------------------------
#19/10/2018 - Freda

Conclusion

1. ExtLib folder: 
js and css extension files in this folder has its original comments by the original developer.
no additional changes has done for this folder.

2. Lib folder: 
js,html and css extension files in this folder has its original comments by the original developer.
no additional changes has done for this folder.

3. Popover folder: 
js and css file in this folder has its original comments by the original developer.
html code has changes with comments on its content. 

i. "Popover.js" has changes on it. The Menu content is commented out.
changes at: line 205 till 223 'document.getEleme...'

changes at: line 294 till 300 'var axonDisabledEle...'

ii. "Popover.html" has changes on it. Some of the functions and features has been comment out
changes at: line 26 till 35 '<!-- <scrip...'

changes at: line 53 till 59 '<p cl...'

changes at: line 71 till 77 '<p cl... '

changes at: line 83 till 88 '<tr><td class...'

changes at: line 116 '<div i... '

changes at: line 127 '<div i... '


4. Images folder: 
'dictionary.jpg' as our representative icon

5. META-INF folder: 
No changes for these files 

6. Event.js file: 
No changes occur for this file.

7. manifest.json: 
Changes occur as mention above Enhancement #2

-----------------------------------------------------------------------------------------------------------

#End of web extension one
---------------------------------------------------------------------------------------------------------


Web Extension two: todolist
-------------------------------------------------------------------------------------------------------------
First sub-task: #26/09/2018 - Freda

Done: 
1. manifest.json
2. for notes adding features [extra.js] (no function yet)

Left:
1. Edit feature for to-do-list and notes
2. Add and feature function for notes

Refer to CSS file from Codepen:
https://codepen.io/franklynroth/pen/ZYeaBd

Firefox Extension Source: 
1. minimalist-to-do-list - https://addons.mozilla.org/en-US/firefox/addon/minimalist-to-do-list/
2. todolistpro-pro-to-do-list - https://addons.mozilla.org/en-US/firefox/addon/todolistpro-pro-to-do-list/?src=search
reference the extensions .html file and js folder

-------------------------------------------------------------------------------------------------------------
Second sub-task: #28/09/2018 - Ju Kheng

Done: #28/09/2018
1. Changed textbox with character limit to text area.
2. Added note adding feature

Done: #03/10/2018
1. Fix bug causing duplicate entries for notes

Done: #11/10/2018
1. Fix bug in delete note feature. 
2. Added edit feature to notes and to-do list.

Done: #15/10/2018
1. Added comments to code.
2. Housekeep JavaScript files.

Left: 
1. Hover to show instructions so that users know how to fully use extension features. Pass to Shu Xuan.

----------------------------------------------------------------------------------------------------------
Third sub-task: #18/10/2018 - Shu Xuan

Done:
1. Hover to show instructions feature. 

Pending: Documentation for first extension: Todolist

-----------------------------------------------------------------------------------------------------------

#End of web extension two
----------------------------------------------------------------------------------------------------------
