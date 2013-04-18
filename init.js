chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
//console.log('in init.js listener');
	if(typeof pick_pic == 'function'){
		imgs = [];
		urls = [];
		ready_to_show = false;
		displayer = 0;
		holdon = false;
		guessed_page_number = 2;
		guess_again = false;
		guess_pointor = 0;
		degree = 0;
		first_url = '';
		next_url_type = '';
		next_url_model = '';
		stop_getting = false;
		mask_visiable = false;
		eval(request.code);
	}else{
		chrome.extension.sendMessage({code:request.code});
	}
});

