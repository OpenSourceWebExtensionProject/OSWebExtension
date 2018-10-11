var taskList = [];

var init = function() {
	if (localStorage.getItem("tasks") != null){
		taskList = JSON.parse(localStorage.getItem("tasks"));

		if (taskList.length > 0){
			var taskItem = "";
			for (var y = 0; y < taskList.length; y++){
				taskItem += "<li class='task-item-div'><input class='task-checkbox' type='checkbox' tabindex='-1'><span class='task-item'>" + taskList[y] + "</span></li>";
				document.getElementById('todo-items').innerHTML = taskItem;
			}
		}
	}
	else
		taskList = [];

	browser.browserAction.setBadgeBackgroundColor({ color: "#d43f3a"});
	
};

$(document).ready(function() {
	
	init();

	$('#addBtn').click(function() {

		var selectedChoice = document.getElementById("choiceDropDown").selectedIndex;

		//if textbox is not empty
		if ((textbox.value).length != 0){
			// when dropdownlist value is NOTE
			if (selectedChoice == "1") {
				noteItem += "<li class='task-item-div'><span class='note-Item' style='border: 5px;'>" + textbox.value + "</span>" + 
							//delete button with the icon
							"<button name='deleteBtn" + noteList.length + "'  style='font-size:8px; float:right; background-color:Transparent; border:0px;'>Delete</button></li>";
							// //edit button with the icon
							// "<button name='editBtn" + noteList.length +"'  style='font-size:8px; float:right; background-color:Transparent; border:0px;'>Edit</button></li>";

				document.getElementById('note-items').innerHTML = noteItem;

				noteList.push(textbox.value);
				localStorage.setItem('noteItem', JSON.stringify(noteList));
				addBtnListeners();
			}
			//when dropdownlist value is todo list
			else {

				var task = textbox.value;
				
				taskList.push(task);
				localStorage.setItem('tasks', JSON.stringify(taskList));

				var taskItemDiv = "<li class='task-item-div'><input class='task-checkbox' type='checkbox'><span class='task-item'>" + task + "</span></li>";
				document.getElementById('todo-items').innerHTML = taskItemDiv;
				$(".task").val('');
				$(".task").focus();
			}
		}
		
	});
	
	var text = browser.i18n.getMessage("addTask");

	$(".task").val(text);

	$(".task").focus(function() {
		$(this).addClass("active");
		if($(this).val() == text) $(this).val("");
	});

	$(".task").blur(function() {
		$(this).removeClass("active");
		if($(this).val() == "") $(this).val(text);
	});

	//when checkbox is checked
	$(document).on('click', '.task-checkbox', function(){
    	if ($(this).is(':checked')) {
    		var el = $(this);
    		var task = el.next('.task-item').html();

			taskList = JSON.parse(localStorage.getItem("tasks"));
			var index = taskList.indexOf(task);
			if (index != -1) {
				taskList.splice(index, 1);
			}

			localStorage.setItem('tasks', JSON.stringify(taskList));

			el.next('.task-item').css('color', '#404040');
			el.next('.task-item').css('text-decoration', 'line-through');
			el.parent().fadeOut(2000);
    	}
    });

	//double click to edit note items
	$(document).on('click', '.note-Item', function(){
		var oldTask = $(this).html();
		$(this).editable(function(value, settings) {

			noteList = JSON.parse(localStorage.getItem("noteItem"));
			var index = noteList.indexOf(oldTask);
			if (index != -1) {
				noteList[index] = value;
			}

			localStorage.setItem('noteItem', JSON.stringify(noteList));

		    return(value);
		}, {
			onblur : "submit",
			width:"192px",
            height:"15px",
		});
	});

	//double click to edit to do list items
	$(document).on('click', '.task-item', function(){
		var oldTask = $(this).html();
		$(this).editable(function(value, settings) {

			taskList = JSON.parse(localStorage.getItem("tasks"));
			var index = taskList.indexOf(oldTask);
			if (index != -1) {
				taskList[index] = value;
			}

			localStorage.setItem('tasks', JSON.stringify(taskList));

		    return(value);
		}, {
			onblur : "submit",
			width:"192px",
            height:"15px",
		});
	});

	$(document).on('click', '.icon-icon', function(){
		$('.task').css('visibility','visible').focus();
		$('.task').focus();
	});	
	
});