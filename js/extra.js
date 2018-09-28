
//initialise variables
var todoList = [];
var noteList = [];
var todoItem = "";
var noteItem = "";
var addButton = document.getElementById("addBtn");
var textbox = document.getElementById("task");
var checkbox = document.querySelector("input[name=checkbox]");

//functions that will run on page load

initialiseValues();
// removeValues();
addButton.addEventListener("click", choices);

//function to check user selected which dropdown value
function choices() {
	// get dropdown selected index
	var selectedChoice = document.getElementById("choiceDropDown").selectedIndex;

	//if textbox is not empty
	if ((textbox.value).length != 0){
		// when dropdownlist value is NOTE
		if (selectedChoice == "1") {
			noteItem += "<li class='task-item-div'><span style='border: 5px;'>" + textbox.value + "</span></li>";
			document.getElementById('note-items').innerHTML = noteItem

			noteList.push(textbox.value);
			localStorage.setItem('noteItem', JSON.stringify(noteList));
		}
	}
	//if textbox is empty
	else
		alert('Textbox should not be empty!');
}

//to load to do and notes that are stored in local storage on page load
function initialiseValues() {
	//retrieve to do and notes that are stored in browser local storage

	if (localStorage.getItem("noteItem") != null){
		noteList = JSON.parse(localStorage.getItem("noteItem"));

		if (noteList.length > 0){
			for (var y = 0; y < noteList.length; y++){
				noteItem += "<li class='task-item-div'><span style='border: 5px;'>" + noteList[y] + "</span></li>";
				document.getElementById('note-items').innerHTML = noteItem
			}
		}
	}
	else
		noteList = [];
}

function removeValues(){
	localStorage.clear();
}