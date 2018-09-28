
var init = function() {
	
	browser.storage.local.get('tasks', function(obj){
		
		var items = obj.tasks? obj.tasks : new Array();
		if (items.length > 0) {
			
			todoList = "";
			for (var i = 0; i < items.length; i++){
				todoList += "<li class='task-item-div'><input class='task-checkbox' type='checkbox' tabindex='-1'><span class='task-item'>" + items[i] + "</span></li>";
			}
			$('.todo-list').html(todoList);
			browser.browserAction.setBadgeText({text: items.length.toString()});	
		}
	});
	browser.browserAction.setBadgeBackgroundColor({ color: "#d43f3a"});
	
};

$(document).ready(function() {
	
	init();

	$('.todo-form').submit(function(e) {
		e.preventDefault();
		if ((!$.trim($(this).find('.task').val()))
			|| ($.trim($(this).find('.task').val())=="مهمة جديدة")
			|| ($.trim($(this).find('.task').val())=="Neue aufgabe...")
			|| ($.trim($(this).find('.task').val())=="New task...")
			|| ($.trim($(this).find('.task').val())=="Nueva tarea...")
			|| ($.trim($(this).find('.task').val())=="Nouvelle tâche...")
			|| ($.trim($(this).find('.task').val())=="Nuovo compito...")
			|| ($.trim($(this).find('.task').val())=="新しい仕事...")
			|| ($.trim($(this).find('.task').val())=="새 작업...")
			|| ($.trim($(this).find('.task').val())=="Nieuwe taak...")
			|| ($.trim($(this).find('.task').val())=="Nowe zadanie...")
			|| ($.trim($(this).find('.task').val())=="Nova tarefa...")
			|| ($.trim($(this).find('.task').val())=="Новое задание...")
			|| ($.trim($(this).find('.task').val())=="Yeni görev...")){

			$('.task').focus();
			
		} else {
			var task = $(this).find('.task').val();
			browser.storage.local.get('tasks', function(obj){
				var tasks = obj.tasks? obj.tasks : new Array();
				tasks.push(task);
				browser.storage.local.set({'tasks': tasks}, function(){
					var taskItemDiv = "<li class='task-item-div'><input class='task-checkbox' type='checkbox'><span class='task-item'>" + task + "</span></li>";
					$('.todo-list').append(taskItemDiv);
					$(".task").val('');
					$(".task").focus();
					browser.browserAction.setBadgeText({text: tasks.length.toString()});
				});
			});
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

	$(document).on('click', '.task-checkbox', function(){
    	if ($(this).is(':checked')) {
    		var el = $(this);
    		var task = el.next('.task-item').html();
    		browser.storage.local.get('tasks', function(obj){
    			var tasks = obj.tasks;
				var index = tasks.indexOf(task);
				if (index != -1) {
					tasks.splice(index, 1);
				}
				browser.storage.local.set({'tasks': tasks}, function(){
					el.next('.task-item').css('color', '#404040');
					el.next('.task-item').css('text-decoration', 'line-through');
    				el.parent().fadeOut(2000);
    				browser.browserAction.setBadgeText({text: tasks.length.toString()});
				});
			});
    	}
    });

	$(document).on('click', '.task-item', function(){
		var oldTask = $(this).html();
		$(this).editable(function(value, settings) {
			browser.storage.local.get('tasks', function(obj){
				var tasks = obj.tasks;
				var index = tasks.indexOf(oldTask);
				if (index != -1) {
					tasks[index] = value;
				}
				browser.storage.local.set({'tasks': tasks});
			});
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