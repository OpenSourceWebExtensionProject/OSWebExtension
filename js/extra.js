
//initialise variables
var noteList = [];
var noteItem = "";
var addButton = document.getElementById("addBtn");
var textbox = document.getElementById("task");

//functions that will run on page load
initialiseValues();
// removeValues();
// addButton.addEventListener("click", choices);

// from the ul with id note-items, select the li inside
var items = document.querySelectorAll("#note-items li");
var editButtons = null;
var deleteButtons = null;

function addBtnListeners(){
	editButtons = document.querySelectorAll("button[name*='editBtn']");
	deleteButtons = document.querySelectorAll("button[name*='deleteBtn']");
	var index = 0;

	for (var i = 0; i < editButtons.length; i++){
		editButtons[i].addEventListener("click", function(){
			index = this.name.split('editBtn').pop();
			alert(index);
		});

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

function editNote(ElementName) {
	var index = (ElementName.split('editBtn').pop());
	alert(index);
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
				var name = 'editBtn' + y;

				noteItem += "<li class='task-item-div'><span style='border: 5px;'>" + noteList[y] + "</span>" + 
							//delete button with the icon
							"<button name='deleteBtn" + y + "' style='font-size:8px; float:right;'>Delete</button>" +
							//edit button with the icon
							"<button name='editBtn" + y + "' style='font-size:8px; float:right;'>Edit</button></li>";

				document.getElementById('note-items').innerHTML = noteItem
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