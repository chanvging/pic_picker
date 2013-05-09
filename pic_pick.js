var idx = 0;
var parser_box = document.createElement('div');
var imgs = [];
var small_imgs = [];
var urls = [];
var ready_to_show = false;
var displayer = 0;
//var holdon = true;
var holdon = false;
var width_limit=300, height_limit=300;
var guessed_page_number = 2;
var guess_again = false;
var guess_pointor = 0;
var guess_char = ['_', '-', '$', ''];
var degree = 0;
var base_dir = '/apps/picpicker';
var pic_path = base_dir;
var first_url = '';
var url_parser = document.createElement('a');
var next_url_type = '';
var next_url_model = '';
var stop_getting = false;
var scroll_bar_position = 0;
var mask_visiable = false;

function pick_pic(url){
//console.log('executing pick_pic');
    if(typeof url == 'undefined'){
		window.stop();
        first_url = window.location.href;
    }else{
        first_url = url;
    }
    	
	urls.push(first_url);
	get_content(first_url);
	
    init_ui();
    show_pic_list();
    bind_key();
	
    idx=-1;
	
	show_mask();
	
}

function guess_url_model(){

    url_parser.href = first_url;
    url_model = '';
    if(url_parser.search!=''){
        var str_srch = url_parser.search.replace('?','');
        var srches = str_srch.split('&');
        for(var i=0; i<srches.length; i++){
            var vk = srches[i].split('=');
            if(vk[0]=='p' || vk[1]=='page'){
                url_model = first_url.replace(srches[i], vk[0]+'=@@');
                guessed_page_number = parseInt(vk[1], 10)+1;
                break;
            }
        }
        if(url_model==''){
            url_model = first_url + '&p=@@';
        }
    }else{
        if(/[$_-](\d+)\.s?html?$/.test(first_url)){
            guessed_page_number = parseInt(RegExp.$1, 10)+1;
            url_model = first_url.replace(/([$_-])\d+(\.s?html?)$/, '\$1@@\$2');
			console.log(url_model);
        }else{
            url_model = first_url.replace(/(\.s?html?)$/, guess_char[guess_pointor++] + '@@\$1');
            guess_again = guess_pointor<guess_char.length;
        }
    }
	
}

function init_ui(){

	mask_frame = document.getElementById('pic_mask');
	
	if(mask_frame == null){
		mask_frame = document.createElement('div');
		mask_frame.setAttribute('id', 'pic_mask');
		mask_frame.style.position = 'absolute';
		mask_frame.style.display = 'none';
		mask_frame.style.left = '0px';
		mask_frame.style.top = '0px';
		mask_frame.style.zIndex = '1000';
		mask_frame.style.textAlign = 'center';
		mask_frame.style.width = '100%';
		mask_frame.style.minHeight = '100%';
		//mask_frame.scrolling = 'auto';
		//mask_frame.frameborder = 0;
		mask_frame.style.backgroundColor = 'wheat';
		document.body.appendChild(mask_frame);
		
		page_info = $('<div>');
		page_info.css({
			'position':'fixed',
			'top':'5px',
			'left':'10px',
			'font-size':'30px',
			'color':'black',
			'font-family':'Arial, Helvetica, sans-serif'
		}).appendTo(mask_frame);
		
		img_player = document.createElement('img');
		img_player.style.margin = '20px 0 80px 0';
		img_player.onload = image_loaded;
		mask_frame.appendChild(img_player);
		
		canvas = document.createElement('canvas');
		canvas.style.display = 'none';
		cContext = canvas.getContext('2d');
		mask_frame.appendChild(canvas);
		
		var menus = [
			["Prev","menu/prev.png", function(){next_img('left');}],
			["Next","menu/next.png", function(){next_img('right');}],
			["Play","menu/play.png", function(){
				auto_display();
				var pic_name = displayer==0 ? 'play.png' : 'pause.png';
				$(this).children('img').attr('src', chrome.extension.getURL('menu/'+pic_name));
			}],
			["Download","menu/download.png", function(){download();}],
			["Download All","menu/download_all.png", function(){download_all();}],
			["Rotate","menu/rotate.png", function(){rotate();}],
			["Delete","menu/delete.png", function(){del_pic();}],
			["Close","menu/close.png", function(){stop_show();}],
		];
		
		menu_obj = $('<div>').addClass('expand-up');
		var ul_obj = $('<ul>');
		var li_obj = $('<li>');
		var a_obj = $('<a href="javascript:;">');
		for(var i=0; i<menus.length; i++){
			var img_url = chrome.extension.getURL(menus[i][1]);
			var new_a_obj = a_obj.clone().click(menus[i][2]).html('<span>'+menus[i][0]+'</span><img src="'+img_url+'"/>');
			li_obj.clone().append(new_a_obj).appendTo(ul_obj);
		}
		menu_obj.append(ul_obj).appendTo(mask_frame);
		menu_obj.hover(function(){
			$(this).css('opacity', '1');
		}, function(){
			$(this).css('opacity', '0.5');
		});
				
	}
	
}

function bind_key(){
    document.onclick = function(){
        return true;
    };
    document.onkeyup = null;
    document.onkeydown = function(e){
        e = window.event || e;
		if(mask_visiable){
			switch(e.keyCode){
				case 37:// <-
					next_img('left');
					return false;
					break;
				case 39:// ->
					next_img('right');
					return false;
					break;
				case 32://blank bar
					auto_display();
					return false;
					break;
				case 82://r
					rotate();
					return false;
					break;
				case 83:// s for stop getting conetents from url
					stop_getting = true;
					return false;
					break;
				case 27://esc
					//window.close();
					stop_show();
					return false;
					break;
				case 72://h for holdon
					holdon = !holdon;
					return false;
					break;
				case 88://x for delete pic
					del_pic();
					return false;
					break;
				case 68://d for download pic
					download();
					return false;
					break;
				case 65://a for download all pic
					download_all();
					return false;
					break;
				default:
					return true;
			}
		}else{
			switch(e.keyCode){
				case 86:// v for show the mask
					show_mask();
					return false;
					break;
				default:
					return true;
			}
		}
    };
}

function not_big_pic(src){
    if(typeof(src)!='string') return true;
	if($.inArray(src, small_imgs)>=0){
		return true;
	}
    if(src.indexOf('.gif')>0 && src.indexOf('.jpg')==-1){
		small_imgs.push(src);
		return true;
	}
    if(src.indexOf('.png')>0 && src.indexOf('.jpg')==-1){
		small_imgs.push(src);
		return true;
	}
    if(src.indexOf('.htm')>0 && src.indexOf('.jpg')==-1){
		small_imgs.push(src);
		return true;
	}
    return false;
}

function check_pic_size(src){
console.log(src);
	var img_obj = $('<img>');
	img_obj.attr('src', src);
	img_obj.load(function(){
		console.log('height:'+$(this).height()+' width:'+$(this).width());
		if($(this).height()>=height_limit || $(this).width()>=width_limit){
			if($.inArray(src, small_imgs)==-1) imgs.push(src);
			if(idx==-1){
				next_img();
			}
		}else{
			small_imgs.push(src);
		}
		$(this).remove();
	});
	img_obj.hide().appendTo('body');
}

function get_images(obj){

    if(typeof(obj)=='object'){
		var has_pics = false;
        var images = obj.getElementsByTagName('img');
        var len = images.length;
        for(var i=0; i<len; i++){
            if(images[i].src && !not_big_pic(images[i].src)){
                check_pic_size(images[i].src);
				has_pics = true;
            }
        }
		
        var inputs = obj.getElementsByTagName('input');
        len = inputs.length;
        for(var i=0; i<len; i++){
            if(inputs[i].type='image' && inputs[i].src && !not_big_pic(inputs[i].src)){
                check_pic_size(inputs[i].src);
				has_pics = true;
            }
        }
		
		if(!has_pics && next_url_type=='guess' && (next_url_model!='' || !guess_again)){
			remove_same_pic();
			show_pic_list();
			return false;
		}
    }
	
    var url_send = false;
	
    var next_page_url = get_next_url(obj);
	
    var url_has_send = false;
    for(var j=0; j<urls.length; j++){
        if(urls[j]==next_page_url){
            url_has_send = true;
            break;
        }
    }
    if(url_has_send==false){
        urls.push(next_page_url);
        url_send = get_content(next_page_url);
    }
	
    if(!url_send){
        remove_same_pic();
        show_pic_list();
    }
}

function get_next_url(obj){
	if(next_url_type=='next_page'){
		return get_next_page_url(obj);
	}else if(next_url_type=='guess'){
		if(next_url_model!=''){
			return get_guessed_next_url();
		}else{
			if(guess_again){
				guess_url_model();
				return get_guessed_next_url();
			}
		}
	}else{
		var next_url = get_next_page_url(obj);
		if(next_url!=''){
			next_url_type = 'next_page';
			return next_url;
		}else{
			next_url_type = 'guess';
			guess_url_model();
			return get_guessed_next_url();
		}
	}
}

function get_next_page_url(obj){
	if(typeof obj == 'undefined') return '';
	url_parser.href = first_url;
    var links = obj.getElementsByTagName('a');
    len = links.length;
    for(var i=len-1; i>0; i--){
        if(links[i].innerHTML=='下一页' || links[i].title=='下一页' || links[i].innerHTML=='下一张' || links[i].title=='下一张'){
            if(links[i].href && links[i].href.indexOf('#')==-1 && links[i].href!='javascript:;'){
                var orig_link = links[i].getAttribute('href');
				if(orig_link.indexOf('http://')==0){
					//return orig_link;
				}else if(orig_link.indexOf('/')==0){
					orig_link = url_parser.protocol + '//' + url_parser.hostname + orig_link;
				}else{
					orig_link = url_parser.protocol + '//' + url_parser.hostname + url_parser.pathname.substring(0, url_parser.pathname.lastIndexOf('/')) + '/' + orig_link;
				}
				return orig_link;
            }
        }
    }
	return '';
}

function get_guessed_next_url(){
	var the_url_model = next_url_model=='' ? url_model : next_url_model;
    if(the_url_model=='') return '';
    return the_url_model.replace('@@', guessed_page_number++);
}

function remove_same_pic(){
    var same = false;
    for(var i=0; i<imgs.length; i++){
        if(imgs[i]=='') continue;
        same = false;
        for(var j=i+1; j<imgs.length; j++){
            if(imgs[i]==imgs[j]){
                imgs[j] = '';
                same = true;
            }
        }
        if(same){
			small_imgs.push(imgs[i]);
			imgs[i] = '';
		}
    }
}

function next_img(direct){
    if(!holdon){
        canvas.style.display = 'none';//hidden canvas
        degree = 0;//reset the degree of ratate
        img_player.style.display = '';
    }
	
    if(imgs.length==0){
        return false;
    }
	
    direct=='left' ? idx-- : idx++;

    if(idx>=imgs.length){
        idx = 0;
    }else if(idx<0){
        idx = imgs.length-1;
    }
    page_info.html((idx+1) + '/' +imgs.length);
    if(imgs[idx]){
        img_player.src = imgs[idx];
    }else{
        next_img(direct);
    }
}

function parse_pic(html){
    html = html.replace(/<script(.|\s)*?\/script>/g, '');	
    if(html=='') return false;
    parser_box.innerHTML = html;
    get_images(parser_box);
}

function get_content(url){

	if(stop_getting) return false;
	
    if(url=='' || url=='javascript:;' || url.indexOf('#')>=0){
        return false;
    }
	
    var xmlhttp;
    if(window.XMLHttpRequest){
        xmlhttp = new XMLHttpRequest();
    }else{
        xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
    }
	
    xmlhttp.onreadystatechange = function(){
        if(xmlhttp.readyState==4){
            if(xmlhttp.status==200){
				if(next_url_type=='guess' && next_url_model==''){
					next_url_model = url_model;
				}
                parse_pic(xmlhttp.responseText);
            }else if(xmlhttp.status==404 && guess_again==true){
                guessed_page_number--;
                get_images();
            }
        }
    }
	
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
	
    return true;
}

function del_pic(){
    imgs[idx] = '';
    next_img();
}

function show_pic_list(){
    if(ready_to_show){
	/*
        var pic_list_str = '';
        for(var i=0; i<imgs.length; i++){
            pic_list_str += '<li><img src="'+imgs[i]+'"/></li>';
        }
	
        var pic_list = document.createElement('ul');
        pic_list.style.display = 'none';
        pic_list.innerHTML = pic_list_str;
        document.body.appendChild(pic_list);
		*/
    }else{
        ready_to_show = true;
    }
}

function auto_display(){
    if(displayer==0){
        displayer = setInterval("next_img()", 3000);
        next_img();
    }else{
        clearInterval(displayer);
        displayer = 0;
    }
}

function rotate(real_degree){
    if(typeof(real_degree)=='undefined'){
        if(typeof(degree)=='undefined' || degree<0 || degree>270) degree=0;
        degree += 90;
    }else{
        degree = real_degree;
    }
    var cw=img_player.width, ch=img_player.height, cx=0, cy=0;
    switch(degree){
        case 90:
            cw = img_player.height;
            ch = img_player.width;
            cy = img_player.height * (-1);
            break;
        case 180:
            cx = img_player.width * (-1)
            cy = img_player.height * (-1);
            break;
        case 270:
            cw = img_player.height;
            ch = img_player.width;
            cx = img_player.width * (-1);
            break;
    }
    canvas.setAttribute('width', cw);
    canvas.setAttribute('height', ch);
    cContext.rotate(degree * Math.PI / 180);
    cContext.drawImage(img_player, cx, cy);
    img_player.style.display = 'none';
    canvas.style.display = '';
}

function image_loaded(){
    if(!holdon) return false;
    rotate(degree);
}

function download_all(){
	for(var i=0; i<imgs.length; i++){
		if(imgs[i]=='') continue;
		console.log(i);
		download(imgs[i]);
	}
}

function download(img_src){
	if(typeof img_src == 'undefined'){
		img_src = imgs[idx];
	}
	if(img_src=='') return false;
	var evt = document.createEvent('MouseEvents');
	evt.initMouseEvent("click", !1, !1, window, 1, 0, 0, 0, 0, !1, !0, !1, !1, 0, null);
	var download_box = document.createElement('a');
	download_box.href = img_src;
	download_box.dispatchEvent(evt);
/*
    pic_path = base_dir;
    send_pcs_post(imgs[idx]);
*/
}

function send_pcs_post(pic_src, callback){
    if(typeof pic_src == 'undefined' || pic_src==''){
        if(typeof callback == 'function'){
            callback();
        }
        return false;
    }
    var xmlhttp;
    if(window.XMLHttpRequest){
        xmlhttp = new XMLHttpRequest();
    }else{
        xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
    }
    var access_token = '3.a05c2fcdc98c34f6c69f83ee19d99a8e.2592000.1366865799.1057017213-636955';
    var pcs_url = 'https://pcs.baidu.com/rest/2.0/pcs/services/cloud_dl?method=add_task&access_token=' + access_token;
    var query_str = make_query_str(pic_src);

    xmlhttp.open('POST', pcs_url);
    xmlhttp.onreadystatechange = function(){
        if(xmlhttp.readyState==4){
            if(xmlhttp.status==200 || xmlhttp.status==409){
                var result = JSON.parse(xmlhttp.responseText);
                if(typeof result['error_code'] != 'undefined' && result['error_code']>0){
                    alert(result['error_msg']);
                }else{
                    alert('download task added!');
                }
                if(typeof callback == 'function'){
                    callback();
                }
            }else if(xmlhttp.status==404){
                alert('404 error');
            }
        }
    }
    xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    xmlhttp.send(query_str);
}
function make_query_str(pic_src){
    var params = {
        'save_path':encodeURIComponent(pic_path),
        'expires':'',
        'source_url':encodeURIComponent(pic_src),
        'timeout':3600,
        'callback':''
    };
    var query_str_arr = [];
    for(var i in params){
        query_str_arr.push(i+'='+params[i]);
    }
    return query_str_arr.join('&');
}

function stop_show(){
	stop_getting = true;
	hide_mask();
	if(displayer!=0){
        clearInterval(displayer);
        displayer = 0;
	}
}

function show_mask(){
	scroll_bar_position = document.body.scrollTop;
	for(var i=0; i<document.body.childNodes.length; i++){
		if(hideable(document.body.childNodes[i].nodeName)){
			document.body.childNodes[i].style.display = 'none';
		}
	}
	mask_frame.style.display = 'block';
	mask_visiable = true;
}

function hide_mask(){
	for(var i=0; i<document.body.childNodes.length; i++){
		if(hideable(document.body.childNodes[i].nodeName)){
			document.body.childNodes[i].style.display = '';
		}
	}
	mask_frame.style.display = 'none';
	document.body.scrollTop = scroll_bar_position;
	mask_visiable = false;
}

function hideable(tag){
	var hideable_tags = ['DIV', 'A', 'P', 'UL', 'OL', 'TABLE', 'DL'];
	for(var i=0; i<hideable_tags.length; i++){
		if(tag == hideable_tags[i]) return true;
	}
	return false;
}

//pick_pic();

