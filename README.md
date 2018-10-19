# OSWebExtension
This repository consist of three web extension design for Firefox 
-------------------------------------------------------------------------------------------------------------
Web Extension two: Dictionary and Word of the Day.
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

#19/10/2018 - Freda

<<Conclusion>>

1. ExtLib folder: 
js and css extension files in this folder has its original comments by the original developer.
no additional changes has done for this folder.

2. Lib folder: 
js,html and css extension files in this folder has its original comments by the original developer.
no additional changes has done for this folder.

3. Popover folder: 
js and css file in this folder has its original comments by the original developer.
html code has changes with comments on its content. 

"Popover.js" has changes on it. The Menu content is commented out.
changes at: line 205 till 223 'document.getElementById("back").addEventListener('click', function()...'

changes at: line 294 till 300 'var axonDisabledElement = document.getElementById("axonDisabled");...'


4. Images folder: 
'dictionary.jpg' as our representative icon

5. META-INF folder: 
No changes for these files 

6. Event.js file: 
No changes occur for this file.

7. manifest.json: 
Changes occur as mention above Enhancement #2



 

-----------------------------------------------------------------------------------------------------------

#End
---------------------------------------------------------------------------------------------------------
