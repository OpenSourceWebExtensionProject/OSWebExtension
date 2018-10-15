
// global variables
var textbox = document.getElementById("task");
var taskList = [];
var noteList = [];
var noteItem = "";

// function that will initialise values from browser local storage
var init = function() {
	// check if there is existing to-do items stored in storage
	if (localStorage.getItem("tasks") != null){
		// to-do items are stored in array form, load the array into taskList variable
		taskList = JSON.parse(localStorage.getItem("tasks"));

		// if there are items in taskList
		if (taskList.length > 0){
			var taskItem = "";
			// display each items in list format
			for (var y = 0; y < taskList.length; y++){
				// html code to display the item
				taskItem += "<li class='task-item-div'><input class='task-checkbox' type='checkbox' tabindex='-1'><span class='task-item'>" + taskList[y] + "</span></li>";
				// set HTML so that it will be displayed on screen
				document.getElementById('todo-items').innerHTML = taskItem;
			}

			// to show how many items are in to-do list like a notification
            browser.browserAction.setBadgeText({
                text: taskList.length.toString()
            });
		}
	}
	// if no to-do items just initialise as an empty array
	else
		taskList = [];

	// set the notification background as red
	browser.browserAction.setBadgeBackgroundColor({ color: "#d43f3a"});

	// check if there is existing notes items stored in storage
	if (localStorage.getItem("noteItem") != null){
		// note items are stored in array form, load the array into noteList variable
		noteList = JSON.parse(localStorage.getItem("noteItem"));

		// if there are items in noteList
		if (noteList.length > 0){
			// display each items in list format
			for (var y = 0; y < noteList.length; y++){
				// html code to display the item
				noteItem += "<li class='task-item-div'><span class='note-Item' style='border: 5px;'>" + noteList[y] + "</span>" + 
							"<button name='deleteBtn" + y + "' style='font-size:8px; float:right;'>Delete</button></li>";

				// set HTML so that it will be displayed on screen
				document.getElementById('note-items').innerHTML = noteItem;
			}
		}
	}
	else
		noteList = [];

	// add button listeners for delete button in notes section
	addBtnListeners();
};

// add delete function for delete buttons
function addBtnListeners(){
	deleteButtons = document.querySelectorAll("button[name*='deleteBtn']");
	var index = 0;

	for (var i = 0; i < deleteButtons.length; i++){
		// add delete functions to every delete button found
		deleteButtons[i].addEventListener("click", function(){
			// get the index of clicked button
			index = this.name.split('deleteBtn').pop();
			// remove index item from array
			noteList.splice(index, 1);
			// update browser storage
			localStorage.setItem('noteItem', JSON.stringify(noteList));
			
		});
	}
}

// when page is ready
$(document).ready(function() {
	// initialise value
	init();

	// add on click button listener to 'Add' Button
	// this function will run when 'Add' Button is clicked
	$('#addBtn').click(function() {
		// get the selected index of the drop down list
		var selectedChoice = document.getElementById("choiceDropDown").selectedIndex;

		//if textarea is not empty
		if ((textbox.value).length != 0){

			// when dropdownlist value is NOTE
			if (selectedChoice == "1") {
				// html code to display note item
				noteItem += "<li class='task-item-div'><span class='note-Item' style='border: 5px;'>" + textbox.value + "</span>" + 
							//delete button with the icon
							"<button name='deleteBtn" + noteList.length + "'  style='font-size:8px; float:right; background-color:Transparent; border:0px;'>Delete</button></li>";

				// set HTML so that it will be displayed on screen
				document.getElementById('note-items').innerHTML = noteItem;

				// add the textbox value into the noteList array
				noteList.push(textbox.value);
				
				// update the noteList to browser storage so that new value is
				// also loaded next time web extension is closed and opened again
				localStorage.setItem('noteItem', JSON.stringify(noteList));

				// add button listener for all delete buttons in notes section
				addBtnListeners();
			}

			//when dropdownlist value is todo list
			else if (selectedChoice == "0") {
				// get the value inside text area
				var task = textbox.value;
				
				// add the text value into taskList array
				taskList.push(task);
				// update the talkList to browser storage so that new value is
				// also loaded next time web extension is closed and opened again
				localStorage.setItem('tasks', JSON.stringify(taskList));

				// html code to display the item
				var taskItemDiv = "<li class='task-item-div'><input class='task-checkbox' type='checkbox'><span class='task-item'>" + task + "</span></li>";
				
				// set HTML so that it will be displayed on screen
				document.getElementById('todo-items').innerHTML = taskItemDiv;
				
				// reset textarea value to empty 
				$(".task").val('');
				// set focus to text area, so that user straight away type in next value
				$(".task").focus();
			}
		}
	});

	//when checkbox is checked, remove the item from storage and array
	$(document).on('click', '.task-checkbox', function(){
    	if ($(this).is(':checked')) {
    		// get the intance that triggered this function
    		var el = $(this);
    		// get the exact text of the item so that can search index from array
    		var task = el.next('.task-item').html();

    		// load the array from the browser local storage
			taskList = JSON.parse(localStorage.getItem("tasks"));

			// get the index of the task value from array
			var index = taskList.indexOf(task);
			
			// if the item is found inside the array,
			if (index != -1) {
				// remove the item from the array
				taskList.splice(index, 1);
			}

			// re-update the array inside browser local storage
			localStorage.setItem('tasks', JSON.stringify(taskList));

			// show animation that strike through the to-do list item
			el.next('.task-item').css('color', '#404040');
			el.next('.task-item').css('text-decoration', 'line-through');
			// fade out to remove item from the screen
			el.parent().fadeOut(2000);

			// re-update how many items are in to-do list like a notification
            browser.browserAction.setBadgeText({
                text: taskList.length.toString()
            });
    	}
    });

	//double click to edit note items
	$(document).on('click', '.note-Item', function(){
		// get exact text from the instance that triggered this event
		var oldTask = $(this).html();

		// show a textbox with the oldTask value 
		$(this).editable(function(value, settings) {
			// get noteList array from browser local storage
			noteList = JSON.parse(localStorage.getItem("noteItem"));

			// get index of the oldTask inside array
			var index = noteList.indexOf(oldTask);

			// if the item is found inside the array
			if (index != -1) {
				// change the value to new one at the same index
				noteList[index] = value;
			}

			// re-update the array in browser local storage
			localStorage.setItem('noteItem', JSON.stringify(noteList));
		    return(value);
		}, {
			// when user clicks outside the textbox, 
			// submit, assuming that user finished editting
			onblur : "submit",
			width:"192px",
            height:"15px",
		});
	});

	//double click to edit to do list items
	$(document).on('click', '.task-item', function(){
		// get exact text from the instance that triggered this event
		var oldTask = $(this).html();

		// show a textbox with the oldTask value 
		$(this).editable(function(value, settings) {
			// get taskList array from browser local storage
			taskList = JSON.parse(localStorage.getItem("tasks"));

			// get index of the oldTask inside array
			var index = taskList.indexOf(oldTask);

			// if the item is found inside the array
			if (index != -1) {
				// change the value to new one at the same index
				taskList[index] = value;
			}

			// re-update the array in browser local storage
			localStorage.setItem('tasks', JSON.stringify(taskList));
		    return(value);
		}, {
			// when user clicks outside the textbox, 
			// submit, assuming that user finished editting
			onblur : "submit",
			width:"192px",
            height:"15px",
		});
	});
});