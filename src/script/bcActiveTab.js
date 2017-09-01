


function download(message) {

  var info = message.info;
  var o_offset = {
    left:info.offsetLeft,
    top:info.offsetTop,
  };
  var o_w_h = {
    h:info.height,
    w:info.width
  };
  var scrollTop = info.scrollTop;
  var scrollLeft = info.scrollLeft;

  chrome.tabs.captureVisibleTab(null, {
    format : "png",
    quality : 100
  }, function(data) {
    var image = new Image();
    image.onload = function() {
      var canvas = document.createElement("canvas");
      canvas.width = o_w_h.w;
      canvas.height = o_w_h.h;
      var context = canvas.getContext("2d");
      context.scale(1/window.devicePixelRatio,1/window.devicePixelRatio);
      context.drawImage(image,-(o_offset.left-scrollLeft) * window.devicePixelRatio,-(o_offset.top-scrollTop) * window.devicePixelRatio );

      var link = document.createElement('a');
      var time = new Date().getTime();
      link.download = "spread-"+time+".png";
      link.href = canvas.toDataURL();
      link.click();

      chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: 'images/create-success.png',
        title: '消息',
        message: '传播图生成成功!'
      });

    };
    image.src = data;
  });
}



function sendMessageToContentScript(message, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
      if(callback) callback(response);
    });
  });
}


//图片生成事件
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){

  if(message.type=='get-bcActiveTab'){
    download( message );
    sendResponse({
      result:'ok',
    });
    //收录数据
    var item = message.data;
    $.post('http://zdm.jiguo.com/admin/Product/InsertProductDraft',{
      catch_data:{
        'name':item.title,
        'detail':item.detail||'',
        'pic':item.pic||[],
        'cover':item.cover || item.pic[0],
        'url':item.url,
        'mall':item.mall,
        'shop':item.shop,
        'price':item.price,
        'mark_price':item.mark_price,
        'discount':item.discount,
      }
    },replayDate=>{
      var list = store.get('data') || [];
      if(replayDate.status==0){
        list.forEach(function (_item,_index) {
          if(_item.id==id){
            list[_index].included = 1;
          }else if(!list[_index].included){
            list[_index].included = 0;
          }
        });
        store.set('data',list);

      }else{
        $.alert(replayDate.message || '收录失败');
      }

      sendMessageToContentScript({
        type:message.type+'-replay',
        data:replayDate
      });

    },'json');

  }else if(message.type=='get-check-cps'){

    $.get('http://zdm.jiguo.com/admin/index/setcps',{
      url:message.url
    },replayDate=>{
      sendMessageToContentScript ({
        type:message.type+'-replay',
        data:replayDate
      });

    });
  }else if(message.type=='get-save-card-data'){
    $.post('http://zdm.jiguo.com/admin/index/InsertPic',{
      pic:message.pic,
      discount:message.discount
    },replayDate=>{
      sendMessageToContentScript({
        type:message.type+'-replay',
        data:replayDate
      });
    },'json');

  }else if(message.type=='get-store'){
    sendResponse({
      storeData:store.get('data')
    });
  }

});


