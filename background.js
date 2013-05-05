chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if(changeInfo.status=='complete'){
		chrome.tabs.executeScript(tabId, {file:"init.js"});
	}
});

function init_picker(tab, code_str){
	chrome.tabs.sendMessage(tab.id, {code: code_str});
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
	chrome.tabs.executeScript(null, {file: "jquery-2.0.0.min.js"});
	chrome.tabs.executeScript(null, {file: "idock/interface.js"});
	chrome.tabs.insertCSS(null, {file: "idock/style.css"});
	chrome.tabs.executeScript(null, {file: "pic_pick.js"}, function(){
	//console.log('loading pic_pick.js');
		chrome.tabs.executeScript(null, {code: request.code});
	});
});

chrome.browserAction.onClicked.addListener(function(tab){
	init_picker(tab, 'pick_pic()');
});

chrome.contextMenus.create({
	"title":"Pick It",
	"contexts":["link"],
	"onclick":function(info, tab){
	//console.log('in context menu');
		init_picker(tab, 'pick_pic(\'' + info.linkUrl + '\')');
	}
});