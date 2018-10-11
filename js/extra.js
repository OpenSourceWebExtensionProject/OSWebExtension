
//initialise variables
var noteList = [];
var noteItem = "";
var addButton = document.getElementById("addBtn");
var textbox = document.getElementById("task");

//functions that will run on page load
initialiseValues();

// from the ul with id note-items, select the li inside
var items = document.querySelectorAll("#note-items li");
var deleteButtons = null;

function addBtnListeners(){
	deleteButtons = document.querySelectorAll("button[name*='deleteBtn']");
	var index = 0;

	for (var i = 0; i < deleteButtons.length; i++){
		deleteButtons[i].addEventListener("click", function(){
			index = this.name.split('deleteBtn').pop();
			// alert(index);
			// remove index item from array
			noteList.splice(index, 1);
			// update browser storage
			localStorage.setItem('noteItem', JSON.stringify(noteList));
			
		});
	}
}

function deleteNote(ElementName) {
	// get index from element name
	var index = (ElementName.split('deleteBtn').pop());
	// remove index item from array
	noteList.splice(index, 1);
	// update browser storage
	localStorage.setItem('noteItem', JSON.stringify(noteList));
}

//to load notes that are stored in local storage on page load
function initialiseValues() {
	//retrieve notes that are stored in browser local storage
	if (localStorage.getItem("noteItem") != null){
		noteList = JSON.parse(localStorage.getItem("noteItem"));

		if (noteList.length > 0){
			for (var y = 0; y < noteList.length; y++){
				noteItem += "<li class='task-item-div'><span class='note-Item' style='border: 5px;'>" + noteList[y] + "</span>" + 
							"<button name='deleteBtn" + y + "' style='font-size:8px; float:right;'>Delete</button></li>";

				document.getElementById('note-items').innerHTML = noteItem;
			}
		}
	}
	else
		noteList = [];

	addBtnListeners();
}

function removeValues(){
	localStorage.clear();
}